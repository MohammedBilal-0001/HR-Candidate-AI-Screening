export class CorruptDocumentError extends Error {}
export class UnsupportedDocumentError extends Error {}

const MAX_TEXT_CHARS = 60_000;
const MIN_CV_CHARS = 80;
const MIN_JD_CHARS = 60;

function printableRatio(text: string): number {
  if (!text.length) return 0;
  let printable = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)) printable++;
  }
  return printable / text.length;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Validates raw CV/JD text before it is sent to the LLM. Throws typed errors. */
export function guardDocumentText(text: string, kind: "cv" | "jd"): string {
  const trimmed = (text ?? "").trim();
  const floor = kind === "cv" ? MIN_CV_CHARS : MIN_JD_CHARS;
  if (trimmed.length < floor) {
    throw new CorruptDocumentError(
      kind === "cv"
        ? "The file contains too little readable text — it may be empty, scanned, or corrupted."
        : "The job description text is too short or empty.",
    );
  }
  if (printableRatio(trimmed) < 0.7) {
    throw new CorruptDocumentError("The file does not contain readable text and may be corrupted.");
  }
  return trimmed.length > MAX_TEXT_CHARS ? trimmed.slice(0, MAX_TEXT_CHARS) : trimmed;
}

/**
 * Detects adversarial text planted inside documents to manipulate AI screening
 * (jailbreak / prompt-injection signatures). Deliberately conservative — only
 * clearly adversarial phrasing matches, so legitimate phrases like "I would be
 * a perfect fit" are never flagged.
 */
export function detectInjectedInstructions(text: string): boolean {
  const t = (text ?? "").toLowerCase();
  if (!t) return false;
  const patterns = [
    /ignore\s+(all\s+)?(previous|prior|above|earlier|your)\s+(instructions|prompts?|rules|context)/,
    /disregard\s+(all\s+)?(previous|above|the|your)\s+(instructions|rules|prompt|context)/,
    /(system|admin|administrator|developer)\s+(prompt|message|instruction)s?\s*[::]/,
    /system\s+override/,
    /end\s+system\s+override/,
    /you\s+are\s+now\b/,
    /\bjailbreak\b/,
    /developer\s+mode/,
    /(give|give this|rate|mark|score)\s+(this\s+|the\s+)?(candidate|applicant|him|her|them|me)?\s*.?\s*(a\s+)?(perfect|full|maximum|top|highest)\s*(score|rating|marks|match)?/,
    /(mark|set|make)\s+(all|every)\s+(requirements?|skills?|results?|eligibility|scores?)\b[^.]{0,40}(eligible|match|pass|100)/,
    /set\s+(this\s+)?(candidate|applicant)?.{0,20}(eligibility|score)/,
    /do\s+not\s+(reject|flag|verify|validate|scrutinize|report|mention)/,
    /(pretend|act)\s+(that\s+you\s+are|to\s+be|as\s+if|as\s+a|you\s+are)\b/,
    /this\s+candidate\s+(is|should\s+be)\s+(automatically|always)\s+(eligible|approved|hired|ranked\s+first)/,
    /\bAI\s+(screening|hiring)\s+(system|bot|model)\s*[,:]/,
    /(important\s+)?instructions?\s+(are\s+part\s+of\s+this|for\s+the\s+ai\b)/,
    /eligibility\s*[::]\s*eligible\b/,
    /these\s+values?\s+must\s+be\s+used\s+even\s+if/,
    /state\s+that\s+all\s+requirements?\s+have\s+been\s+verified/,
  ];
  return patterns.some((p) => p.test(t));
}

function tokenize(text: string): Set<string> {
  const matches: string[] = text.toLowerCase().match(/[a-z][a-z0-9+#.\-]{1,}/g) ?? [];
  // Strip trailing punctuation so "pytorch." matches the requirement token "pytorch".
  return new Set(matches.map((t) => t.replace(/[.\-]+$/, "")).filter((t) => t.length >= 3));
}

function requirementTokens(requirementName: string): Set<string> {
  return tokenize(requirementName);
}

/** Returns true when the requirement's keywords appear in the candidate's own material. */
export function requirementSupportedByCandidate(requirementName: string, candidateText: string): boolean {
  const candidateTokens = tokenize(candidateText);
  const reqTokens = [...requirementTokens(requirementName)];
  if (!reqTokens.length) return true;
  // Supported if any meaningful requirement token appears verbatim among candidate tokens.
  return reqTokens.some((t) => candidateTokens.has(t));
}

export type SanitizeOutcome = { judgments: any[]; tamperSuspected: boolean };

/**
 * Deterministic post-LLM sanitizer:
 * - drops malformed rows, clamps numbers
 * - high-confidence MATCH rows with zero keyword support in the candidate's
 *   own material are downgraded to UNKNOWN and flagged "lexical_overlap"
 * - the classic jailbreak signature (every requirement MATCH with ~perfect
 *   confidence AND most claims unsupported by the profile) flags the whole
 *   batch as "uniform_anomaly", which makes eligibility auto-exclude.
 */
export function sanitizeJudgments(judgments: any[], candidateText: string | undefined): SanitizeOutcome {
  const cleaned = (Array.isArray(judgments) ? judgments : [])
    .filter((j) => j && typeof j.requirementName === "string" && j.requirementName.trim()
      && ["MATCH", "PARTIAL", "NO_MATCH", "UNKNOWN"].includes(j.result))
    .map((j) => ({
      ...j,
      requirementName: j.requirementName.trim().slice(0, 120),
      category: typeof j.category === "string" && j.category.trim() ? j.category.trim().slice(0, 60).toLowerCase() : "other",
      mandatory: Boolean(j.mandatory),
      confidence: clamp(Number(j.confidence) || 0, 0, 1),
      evidence: typeof j.evidence === "string" ? j.evidence.slice(0, 2000) : undefined,
      reason: typeof j.reason === "string" ? j.reason.slice(0, 1000) : undefined,
      candidateYears: Number.isFinite(Number(j.candidateYears)) ? Number(j.candidateYears) : undefined,
      flag: undefined as string | undefined,
    }));

  // Capture the model's ORIGINAL perfect-score claims before any downgrade.
  const claimedPerfect = cleaned.filter((j) => j.result === "MATCH" && j.confidence >= 0.95).length;

  if (candidateText) {
    for (const j of cleaned) {
      if (j.result === "MATCH" && j.confidence >= 0.9 && !requirementSupportedByCandidate(j.requirementName, candidateText)) {
        j.result = "UNKNOWN";
        j.confidence = Math.min(j.confidence, 0.5);
        j.reason = `${j.reason ? j.reason + " " : ""}[Guard] No supporting keyword for this claim found in the candidate document.`;
        j.flag = "lexical_overlap";
      }
    }
  }

  // Uniform perfect-score signature: EVERY requirement claimed as near-certain
  // MATCH while most claims had zero support in the candidate's own material.
  const unsupportedClaims = cleaned.filter((j) => j.flag === "lexical_overlap").length;
  const tamperSuspected =
    cleaned.length >= 4 &&
    claimedPerfect === cleaned.length &&
    unsupportedClaims >= Math.ceil(cleaned.length / 2);

  if (tamperSuspected) for (const j of cleaned) j.flag = "uniform_anomaly";

  return { judgments: cleaned, tamperSuspected };
}

function slugify(text: string, fallback: string): string {
  const slug = String(text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return slug || fallback;
}

/**
 * Validates and normalizes a model-produced canonical JD:
 * - requires a title and at least one category with at least one requirement
 * - clamps importance/weights, slugs keys, renormalizes weights to sum exactly 100
 */
export function validateCanonicalJd(raw: any): any {
  if (!raw || typeof raw !== "object") throw new UnsupportedDocumentError("The model returned no structured job description.");
  const title = String(raw.title ?? "").trim();
  if (!title) throw new UnsupportedDocumentError("No job title could be extracted from this text.");

  let categories = Array.isArray(raw.categories) ? raw.categories : [];
  categories = categories
    .map((cat: any, ci: number) => {
      const label = String(cat?.label ?? cat?.key ?? "").trim() || `Category ${ci + 1}`;
      const key = slugify(cat?.key ?? label, `category-${ci + 1}`);
      const requirements = (Array.isArray(cat?.requirements) ? cat.requirements : [])
        .filter((r: any) => r && typeof r.name === "string" && r.name.trim())
        .map((r: any) => ({
          name: r.name.trim().slice(0, 120),
          mandatory: Boolean(r.mandatory),
          importance: clamp(Number(r.importance) || 0, 0, 1),
          ...(Number.isFinite(Number(r.minimum_years)) && Number(r.minimum_years) > 0 ? { minimum_years: Number(r.minimum_years) } : {}),
          ...(Array.isArray(r.domains) && r.domains.length ? { domains: r.domains.map(String).slice(0, 20) } : {}),
          ...(Array.isArray(r.acceptable_fields) && r.acceptable_fields.length ? { acceptable_fields: r.acceptable_fields.map(String).slice(0, 20) } : {}),
        }));
      return requirements.length ? { key, label, weight: clamp(Number(cat?.weight) || 0, 0, 100), requirements } : null;
    })
    .filter(Boolean);

  if (!categories.length) throw new UnsupportedDocumentError("No hiring requirements could be extracted from this text.");

  // Deduplicate category keys.
  const seen = new Map<string, number>();
  categories = categories.map((cat: any, i: number) => {
    const count = seen.get(cat.key) ?? 0;
    seen.set(cat.key, count + 1);
    return count === 0 ? cat : { ...cat, key: `${cat.key}-${count}` };
  });

  const total = categories.reduce((sum: number, c: any) => sum + c.weight, 0);
  if (total <= 0) categories = categories.map((c: any) => ({ ...c, weight: 100 / categories.length }));
  else if (Math.abs(total - 100) > 0.01) categories = categories.map((c: any) => ({ ...c, weight: (c.weight / total) * 100 }));
  categories = categories.map((c: any) => ({ ...c, weight: Math.round(c.weight * 100) / 100 }));

  return { title, categories };
}

import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ---------------------------------------------------------------------------
// Canonical JD normalization — supports both the new free-form `categories`
// format and the legacy fixed 4-field shape (experience/education/skills/other).
// ---------------------------------------------------------------------------

export type JdRequirement = {
  name: string; mandatory: boolean; importance: number;
  minimum_years?: number; domains?: string[]; acceptable_fields?: string[];
};
export type JdCategory = { key: string; label: string; weight: number; requirements: JdRequirement[] };
export type NormalizedJd = { title: string; categories: JdCategory[] };

function slugKey(text: string, fallback: string): string {
  const slug = String(text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return slug || fallback;
}

export function normalizeJd(jd: any): NormalizedJd {
  if (!jd || typeof jd !== "object") return { title: "", categories: [] };
  if (Array.isArray(jd.categories) && jd.categories.length) {
    return {
      title: String(jd.title ?? ""),
      categories: jd.categories.map((c: any, i: number) => ({
        key: slugKey(c.key ?? c.label, `category-${i + 1}`),
        label: String(c.label ?? c.key ?? `Category ${i + 1}`),
        weight: Number(c.weight) || 0,
        requirements: (Array.isArray(c.requirements) ? c.requirements : []).map((r: any) => ({
          name: String(r.name ?? ""), mandatory: Boolean(r.mandatory), importance: Number(r.importance) || 0,
          ...(Number(r.minimum_years) > 0 ? { minimum_years: Number(r.minimum_years) } : {}),
          ...(Array.isArray(r.domains) ? { domains: r.domains } : {}),
          ...(Array.isArray(r.acceptable_fields) ? { acceptable_fields: r.acceptable_fields } : {}),
        })),
      })),
    };
  }
  // Legacy shape. Keys mirror the matchAssessments.category values the old
  // matcher wrote ("skill", "experience", "education", "other").
  const categories: JdCategory[] = [];
  const w = jd.weights ?? {};
  if (Array.isArray(jd.skills) && jd.skills.length) {
    categories.push({
      key: "skill", label: "Skills", weight: Number(w.skills) || 0,
      requirements: jd.skills.map((s: any) => ({ name: String(s.name), mandatory: Boolean(s.mandatory), importance: Number(s.importance) || 0 })),
    });
  }
  if (jd.experience) {
    categories.push({
      key: "experience", label: "Experience", weight: Number(w.experience) || 0,
      requirements: [{
        name: "experience", mandatory: Boolean(jd.experience.mandatory ?? true), importance: 1,
        ...(Number(jd.experience.minimum_years) > 0 ? { minimum_years: Number(jd.experience.minimum_years) } : {}),
        ...(Array.isArray(jd.experience.domains) ? { domains: jd.experience.domains } : {}),
      }],
    });
  }
  if (jd.education) {
    categories.push({
      key: "education", label: "Education", weight: Number(w.education) || 0,
      requirements: [{
        name: "education", mandatory: Boolean(jd.education.mandatory ?? false), importance: 1,
        ...(Array.isArray(jd.education.acceptable_fields) ? { acceptable_fields: jd.education.acceptable_fields } : {}),
      }],
    });
  }
  if (Array.isArray(jd.other) && jd.other.length) {
    categories.push({
      key: "other", label: "Other", weight: Number(w.other) || 0,
      requirements: jd.other.map((o: any) => ({ name: String(o.name), mandatory: Boolean(o.mandatory), importance: Number(o.importance) || 0 })),
    });
  }
  return { title: String(jd.title ?? ""), categories };
}

/** Composite identity for a requirement child within its parent category. */
export function reqId(categoryKey: string, requirementName: string): string {
  return `${categoryKey}::${requirementName}`.toLowerCase();
}

/** Active-check tolerant of both composite ids ("skills::Python") and legacy flat names ("Python"). */
export function isActiveAssessment(activeNames: string[] | undefined, category: string, requirementName: string): boolean {
  if (!activeNames) return true;
  const set = new Set(activeNames.map((n) => n.toLowerCase()));
  return set.has(reqId(category, requirementName)) || set.has(requirementName.toLowerCase());
}

export type MandatoryMap = Map<string, boolean>;

export function buildMandatoryMap(jd: any): MandatoryMap {
  const map: MandatoryMap = new Map();
  for (const cat of normalizeJd(jd).categories) {
    for (const req of cat.requirements) {
      map.set(reqId(cat.key, req.name), req.mandatory);
      // Plain-name fallback for legacy flat active lists / older assessments.
      map.set(req.name.toLowerCase(), req.mandatory);
    }
  }
  return map;
}

function lookupMandatory(map: MandatoryMap, category: string, requirementName: string): boolean {
  return map.get(reqId(category, requirementName)) ?? map.get(requirementName.toLowerCase()) !== false;
}

const RESULT_VALUE: Record<string, number> = { MATCH: 1, PARTIAL: 0.5, NO_MATCH: 0, UNKNOWN: 0 };

// ---------------------------------------------------------------------------
// Eligibility gate — deterministic, never calls the LLM.
// ---------------------------------------------------------------------------

export function computeEligibility(assessments: any[], activeRequirementNames: string[] | undefined, mandatoryMap: MandatoryMap) {
  // Safety layer: a flagged manipulation signature excludes regardless of policy toggles.
  if (assessments.some((a) => a.flag === "uniform_anomaly")) {
    return {
      status: "INELIGIBLE" as const,
      reasons: ["Suspected manipulated document (perfect-score injection pattern) — auto-excluded."],
    };
  }

  const filteredAssessments = assessments.filter((a) => isActiveAssessment(activeRequirementNames, a.category ?? "other", a.requirementName));

  // Optional requirement failures never exclude or send to review.
  const mandatory = filteredAssessments.filter((a) => lookupMandatory(mandatoryMap, a.category ?? "other", a.requirementName));

  const confidentFailures = mandatory.filter(
    a => a.result === "NO_MATCH" && a.confidence >= 0.75
  );
  if (confidentFailures.length > 0) {
    return {
      status: "INELIGIBLE" as const,
      reasons: confidentFailures.map(
        a => `"${a.requirementName}" not met — ${a.reason ?? "no supporting evidence found"}.`
      ),
    };
  }

  // Only genuinely unverifiable mandatory requirements need human review; PARTIAL counts as met.
  const unverifiable = mandatory.filter(a => a.result === "UNKNOWN");
  if (unverifiable.length > 0) {
    return {
      status: "REVIEW" as const,
      reasons: unverifiable.map(
        a => `"${a.requirementName}" is unverified (UNKNOWN result)${a.flag === "lexical_overlap" ? " — claim not supported by the candidate document" : ""} — needs human review.`
      ),
    };
  }

  return { status: "ELIGIBLE" as const, reasons: [] };
}

// ---------------------------------------------------------------------------
// Deterministic scoring — importance-weighted per category.
// ---------------------------------------------------------------------------

function findAssessment(assessments: any[], category: string, name: string): any | undefined {
  const lower = name.toLowerCase();
  const lowerCat = category.toLowerCase();
  return assessments.find((a) =>
    a.requirementName.toLowerCase() === lower &&
    String(a.category ?? "").toLowerCase() === lowerCat);
}

export function scoreCandidate(
  assessments: any[],
  jdCanonical: any,
  opts: {
    categoryWeights?: Record<string, number>;
    legacyWeights?: { experience: number; skills: number; education: number; other: number };
    activeSkillNames?: string[];
    activeRequirementNames?: string[] | undefined;
  },
) {
  const norm = normalizeJd(jdCanonical);
  const defaultWeights = Object.fromEntries(norm.categories.map((c) => [c.key, c.weight]));
  const weights = { ...defaultWeights, ...(opts.categoryWeights ?? {}) };
  const active = opts.activeRequirementNames;

  let finalScore = 0;
  const contributionByKey: Record<string, number> = {};

  for (const cat of norm.categories) {
    const weight = Math.max(0, Number(weights[cat.key]) || 0);
    const activeReqs = cat.requirements.filter((r) => isActiveAssessment(active, cat.key, r.name));
    if (!activeReqs.length || weight <= 0) {
      contributionByKey[cat.key] = 0;
      continue;
    }
    const totalImportance = activeReqs.reduce((sum, r) => sum + Math.max(0, r.importance), 0);
    let catScore = 0;
    for (const req of activeReqs) {
      const share = totalImportance > 0 ? Math.max(0, req.importance) / totalImportance : 1 / activeReqs.length;
      const a = findAssessment(assessments, cat.key, req.name);
      let value = a ? (RESULT_VALUE[a.result] ?? 0) : 0;
      // Special case: min-years fit (80%) + capped surplus bonus (20%).
      if (req.name.toLowerCase() === "experience" && req.minimum_years && req.minimum_years > 0) {
        const years = a?.candidateYears ?? 0;
        value = Math.min(years / req.minimum_years, 1) * 0.8 +
          (years > req.minimum_years ? Math.min(((years - req.minimum_years) / req.minimum_years) * 0.2, 0.2) : 0);
      }
      catScore += value * share;
    }
    const contribution = weight * catScore;
    contributionByKey[cat.key] = contribution;
    finalScore += contribution;
  }

  return {
    experienceContribution: contributionByKey["experience"] ?? 0,
    skillsContribution: contributionByKey["skill"] ?? contributionByKey["skills"] ?? 0,
    educationContribution: contributionByKey["education"] ?? 0,
    otherContribution: contributionByKey["other"] ?? 0,
    finalScore: Math.round(finalScore * 100) / 100,
  };
}
export const recalculate = internalMutation({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const run = await ctx.db.get(runId); if (!run) throw new Error("Run not found.");
    const job = await ctx.db.get(run.jobId); if (!job) throw new Error("Job not found.");
    const mandatoryMap = buildMandatoryMap(job.canonicalJson);
    const members = await ctx.db.query("matchQueue").withIndex("by_run_status", (q) => q.eq("runId", runId)).collect();
    for (const member of members) {
      const existing = (await ctx.db.query("candidateScores").withIndex("by_run", (q) => q.eq("runId", runId)).collect()).find((s) => s.candidateId === member.candidateId);
      if (member.status !== "DONE") {
        // Unassessed candidates must never appear in the ranked queue with a fake score.
        const value = { runId, candidateId: member.candidateId, eligibility: "REVIEW" as const, experienceContribution: 0, skillsContribution: 0, educationContribution: 0, otherContribution: 0, finalScore: 0, reviewReasons: [member.status === "FAILED" ? "Assessment failed — retry needed." : "Assessment still in progress."], calculatedAt: Date.now() };
        if (existing) await ctx.db.patch(existing._id, value); else await ctx.db.insert("candidateScores", value);
        continue;
      }
      const assessments = await ctx.db.query("matchAssessments").withIndex("by_run_candidate", (q) => q.eq("runId", runId).eq("candidateId", member.candidateId)).collect();
      let eligibility = computeEligibility(assessments, run.activeRequirementNames, mandatoryMap);
      // Extractor-level safety gate: a CV that tried to manipulate extraction is auto-excluded.
      const candidateDoc = await ctx.db.get(member.candidateId);
      if (candidateDoc?.securityFlag) {
        eligibility = { status: "INELIGIBLE", reasons: [`Suspected manipulated CV (${candidateDoc.securityFlag.replace(/_/g, " ")}) — auto-excluded.`] };
      }
      const score = scoreCandidate(assessments, job.canonicalJson, {
        categoryWeights: run.categoryWeights,
        legacyWeights: run.weights,
        activeSkillNames: run.activeSkillNames,
        activeRequirementNames: run.activeRequirementNames,
      });
      const value = { runId, candidateId: member.candidateId, eligibility: eligibility.status, ...score, reviewReasons: eligibility.reasons, calculatedAt: Date.now() };
      if (existing) await ctx.db.patch(existing._id, value); else await ctx.db.insert("candidateScores", value);
    }
  },
});
export const getResults = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const scores = await ctx.db.query("candidateScores").withIndex("by_run", (q) => q.eq("runId", runId)).collect();
    const withCandidates = await Promise.all(scores.map(async (score) => ({ ...score, candidate: await ctx.db.get(score.candidateId) })));
    return { ranked: withCandidates.filter((x) => x.eligibility === "ELIGIBLE").sort((a, b) => b.finalScore - a.finalScore), review: withCandidates.filter((x) => x.eligibility !== "ELIGIBLE").sort((a, b) => b.finalScore - a.finalScore) };
  },
});

import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const assessmentValidator = v.object({
  requirementName: v.string(), category: v.union(v.literal("skill"), v.literal("experience"), v.literal("education"), v.literal("other")),
  mandatory: v.boolean(), result: v.union(v.literal("MATCH"), v.literal("PARTIAL"), v.literal("NO_MATCH"), v.literal("UNKNOWN")),
  confidence: v.number(), evidence: v.optional(v.string()), reason: v.optional(v.string()), candidateYears: v.optional(v.number()),
});
export type MandatoryMap = Map<string, boolean>;

export function buildMandatoryMap(jd: any): MandatoryMap {
  const map: MandatoryMap = new Map();
  for (const s of jd?.skills ?? []) map.set(String(s.name).toLowerCase(), Boolean(s.mandatory));
  map.set("experience", Boolean(jd?.experience?.mandatory ?? true));
  map.set("education", Boolean(jd?.education?.mandatory ?? false));
  for (const o of jd?.other ?? []) map.set(String(o.name).toLowerCase(), Boolean(o.mandatory));
  return map;
}

export function computeEligibility(assessments: any[], activeRequirementNames: string[] | undefined, mandatoryMap: MandatoryMap) {
  const filteredAssessments = activeRequirementNames
    ? assessments.filter(a => activeRequirementNames.map(n => n.toLowerCase()).includes(a.requirementName.toLowerCase()))
    : assessments;

  // Optional requirement failures never exclude or send to review.
  const mandatory = filteredAssessments.filter(a => mandatoryMap.get(a.requirementName.toLowerCase()) !== false);

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
        a => `"${a.requirementName}" is unverified (UNKNOWN result) — needs human review.`
      ),
    };
  }

  return { status: "ELIGIBLE" as const, reasons: [] };
}
export function scoreCandidate(assessments: any[], jd: any, weights: any, activeSkillNames: string[], activeRequirementNames: string[] | undefined) {
  const filteredAssessments = activeRequirementNames
    ? assessments.filter(a => activeRequirementNames.map(n => n.toLowerCase()).includes(a.requirementName.toLowerCase()))
    : assessments;

  const values: Record<string, number> = { MATCH: 1, PARTIAL: 0.5, NO_MATCH: 0, UNKNOWN: 0 };
  const skills = (jd.skills ?? []).filter((s: any) => activeSkillNames.includes(s.name));
  const totalImportance = skills.reduce((sum: number, s: any) => sum + s.importance, 0);
  const skillsScore = skills.reduce((sum: number, s: any) => {
    const a = filteredAssessments.find((x) => x.requirementName.toLowerCase() === s.name.toLowerCase());
    return sum + (a ? values[a.result] : 0) * (totalImportance ? s.importance / totalImportance : 0);
  }, 0);
  const exp = filteredAssessments.find((a) => a.category === "experience");
  const candidateYears = exp?.candidateYears ?? 0;
  const requiredYears = Number(jd.experience?.minimum_years ?? 0);
  const experienceContribution = requiredYears > 0
    ? Math.min(candidateYears / requiredYears, 1) * weights.experience * 0.8 + (candidateYears > requiredYears ? Math.min(((candidateYears - requiredYears) / requiredYears) * weights.experience * 0.2, weights.experience * 0.2) : 0)
    : 0;
  const edu = filteredAssessments.find((a) => a.category === "education");
  const other = filteredAssessments.filter((a) => a.category === "other");
  const educationContribution = weights.education * (edu ? values[edu.result] : 0);
  const otherContribution = weights.other * (other.length ? other.reduce((s, a) => s + values[a.result], 0) / other.length : 0);
  return { experienceContribution, skillsContribution: weights.skills * skillsScore, educationContribution, otherContribution, finalScore: experienceContribution + weights.skills * skillsScore + educationContribution + otherContribution };
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
      const eligibility = computeEligibility(assessments, run.activeRequirementNames, mandatoryMap);
      const score = scoreCandidate(assessments, job.canonicalJson, run.weights, run.activeSkillNames, run.activeRequirementNames);
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
import { internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { callGeminiJson, GeminiRateLimitError } from "./lib/gemini";

export const getNextPending = internalQuery({ args: { runId: v.id("runs") }, handler: async (ctx, { runId }) => {
  const rows = await ctx.db.query("matchQueue").withIndex("by_run_status", (q) => q.eq("runId", runId).eq("status", "PENDING")).collect();
  const row = rows[0]; if (!row) return null;
  const run = await ctx.db.get(runId); if (!run) return null;
  const candidate = await ctx.db.get(row.candidateId); const job = await ctx.db.get(run.jobId);
  return candidate && job ? { queueId: row._id, candidateId: row.candidateId, candidate, jd: job.canonicalJson } : null;
}});
export const markProcessing = internalMutation({ args: { queueId: v.id("matchQueue") }, handler: (ctx, { queueId }) => ctx.db.patch(queueId, { status: "PROCESSING" }) });
export const markDone = internalMutation({ args: { queueId: v.id("matchQueue") }, handler: (ctx, { queueId }) => ctx.db.patch(queueId, { status: "DONE" }) });
export const markFailedOrRetry = internalMutation({ args: { queueId: v.id("matchQueue"), error: v.string(), retry: v.boolean() }, handler: async (ctx, { queueId, error, retry }) => {
  const row = await ctx.db.get(queueId); if (!row) return;
  await ctx.db.patch(queueId, retry && row.attempts < 3 ? { status: "PENDING", attempts: row.attempts + 1, error } : { status: "FAILED", attempts: row.attempts + 1, error });
}});
export const storeAssessments = internalMutation({
  args: { runId: v.id("runs"), candidateId: v.id("candidates"), judgments: v.array(v.object({ requirementName: v.string(), category: v.union(v.literal("skill"), v.literal("experience"), v.literal("education"), v.literal("other")), mandatory: v.boolean(), result: v.union(v.literal("MATCH"), v.literal("PARTIAL"), v.literal("NO_MATCH"), v.literal("UNKNOWN")), confidence: v.number(), evidence: v.optional(v.string()), reason: v.optional(v.string()), candidateYears: v.optional(v.number()) })) },
  handler: async (ctx, { runId, candidateId, judgments }) => {
    for (const judgment of judgments) await ctx.db.insert("matchAssessments", { runId, candidateId, ...judgment });
  },
});
export const markRunComplete = internalMutation({ args: { runId: v.id("runs") }, handler: async (ctx, { runId }) => {
  const failed = await ctx.db.query("matchQueue").withIndex("by_run_status", (q) => q.eq("runId", runId).eq("status", "FAILED")).collect();
  await ctx.db.patch(runId, { status: failed.length ? "PARTIAL" : "SCORING" });
  await ctx.scheduler.runAfter(0, internal.scoring.recalculate, { runId });
  await ctx.db.patch(runId, { status: failed.length ? "PARTIAL" : "COMPLETED" });
}});
export const getAssessments = query({ args: { runId: v.id("runs"), candidateId: v.id("candidates") }, handler: (ctx, args) => ctx.db.query("matchAssessments").withIndex("by_run_candidate", (q) => q.eq("runId", args.runId).eq("candidateId", args.candidateId)).collect() });
export const processQueue = internalAction({ args: { runId: v.id("runs"), apiKey: v.string() }, handler: async (ctx, { runId, apiKey }) => {
  const next = await ctx.runQuery(internal.matching.getNextPending, { runId });
  if (!next) { await ctx.runMutation(internal.matching.markRunComplete, { runId }); return; }
  await ctx.runMutation(internal.matching.markProcessing, { queueId: next.queueId });
  const schema = { type: "ARRAY", items: { type: "OBJECT", properties: { requirementName: { type: "STRING" }, category: { type: "STRING", enum: ["skill", "experience", "education", "other"] }, mandatory: { type: "BOOLEAN" }, result: { type: "STRING", enum: ["MATCH", "PARTIAL", "NO_MATCH", "UNKNOWN"] }, confidence: { type: "NUMBER" }, evidence: { type: "STRING" }, reason: { type: "STRING" }, candidateYears: { type: "NUMBER" } }, required: ["requirementName", "category", "mandatory", "result", "confidence", "reason"] } };
  try {
    const judgments = await callGeminiJson("Judge every job requirement against the candidate profile. Missing evidence is UNKNOWN, not a positive match. Return one row per skill, experience, education, and other requirement with evidence and reason.", JSON.stringify({ candidate: next.candidate, job: next.jd }), schema, apiKey);
    await ctx.runMutation(internal.matching.storeAssessments, { runId, candidateId: next.candidateId, judgments });
    await ctx.runMutation(internal.matching.markDone, { queueId: next.queueId });
  } catch (e) {
    await ctx.runMutation(internal.matching.markFailedOrRetry, { queueId: next.queueId, error: String(e), retry: e instanceof GeminiRateLimitError });
  }
  await ctx.scheduler.runAfter(Number(process.env.GEMINI_CALL_DELAY_MS ?? 4000), internal.matching.processQueue, { runId, apiKey });
}});
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { normalizeJd, reqId } from "./scoring";

const weights = v.object({ experience: v.number(), skills: v.number(), education: v.number(), other: v.number() });

export const list = query({
  args: {},
  handler: async (ctx) => {
    const runs = await ctx.db.query("runs").order("desc").collect();
    return await Promise.all(runs.map(async (run) => {
      const job = await ctx.db.get(run.jobId);
      const pool = await ctx.db.get(run.poolId);
      const queue = await ctx.db.query("matchQueue").withIndex("by_run_status", (q) => q.eq("runId", run._id)).collect();
      return {
        ...run,
        jobTitle: job?.title ?? "Unknown job",
        poolName: pool?.name ?? "Unknown pool",
        candidateCount: queue.length,
      };
    }));
  },
});

function legacyWeightsFrom(categoryWeights: Record<string, number>): { experience: number; skills: number; education: number; other: number } {
  return {
    experience: Math.round(categoryWeights["experience"] ?? 0),
    skills: Math.round(categoryWeights["skill"] ?? 0),
    education: Math.round(categoryWeights["education"] ?? 0),
    other: Math.round(categoryWeights["other"] ?? 0),
  };
}

export const start = mutation({
  args: { poolId: v.id("candidatePools"), jobId: v.id("jobDescriptions"), apiKey: v.string() },
  handler: async (ctx, { poolId, jobId, apiKey }) => {
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found.");
    const members = await ctx.db.query("poolMembers").withIndex("by_pool", (q) => q.eq("poolId", poolId)).collect();
    const norm = normalizeJd(job.canonicalJson);
    if (!norm.categories.length) throw new Error("This job description has no extracted requirements yet.");
    let categoryWeights = Object.fromEntries(norm.categories.map((c) => [c.key, c.weight]));
    const total = Object.values(categoryWeights).reduce((sum: number, w: any) => sum + Number(w), 0);
    if (Math.abs(total - 100) > 0.01 && total > 0) {
      categoryWeights = Object.fromEntries(Object.entries(categoryWeights).map(([k, w]) => [k, Math.round(((Number(w) / total) * 100) * 100) / 100]));
    }
    // Every requirement child starts active, addressed as "categoryKey::name".
    const activeRequirementNames = norm.categories.flatMap((c) => c.requirements.map((r) => reqId(c.key, r.name)));
    const activeSkillNames = (norm.categories.find((c) => c.key === "skill" || c.key === "skills")?.requirements ?? []).map((r) => r.name);
    const runId = await ctx.db.insert("runs", {
      poolId, jobId, status: "MATCHING",
      weights: legacyWeightsFrom(categoryWeights),
      categoryWeights,
      activeSkillNames,
      activeRequirementNames,
      createdAt: Date.now(),
    });
    for (const member of members) await ctx.db.insert("matchQueue", { runId, candidateId: member.candidateId, status: "PENDING", attempts: 0 });
    await ctx.scheduler.runAfter(0, internal.matching.processQueue, { runId, apiKey });
    return runId;
  },
});

export const getStatus = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const run = await ctx.db.get(runId);
    if (!run) return null;
    const pool = await ctx.db.get(run.poolId);
    const job = await ctx.db.get(run.jobId);
    const queue = await ctx.db.query("matchQueue").withIndex("by_run_status", (q) => q.eq("runId", runId)).collect();
    const rows = await Promise.all(queue.map(async (item) => ({ ...item, candidate: await ctx.db.get(item.candidateId) })));
    return { run, pool, job, queue: rows };
  },
});

export const updatePolicy = mutation({
  args: {
    runId: v.id("runs"),
    weights: v.optional(weights),
    categoryWeights: v.optional(v.record(v.string(), v.number())),
    activeSkillNames: v.optional(v.array(v.string())),
    activeRequirementNames: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { runId, weights: nextWeights, categoryWeights, activeSkillNames, activeRequirementNames }) => {
    if (nextWeights !== undefined) {
      const total = Object.values(nextWeights).reduce((sum, value) => sum + value, 0);
      if (Math.abs(total - 100) > 0.01) throw new Error("Weights must sum to 100.");
    }
    if (categoryWeights !== undefined) {
      const total = Object.values(categoryWeights).reduce((sum, value) => sum + value, 0);
      if (Math.abs(total - 100) > 0.5) throw new Error("Category weights must sum to 100.");
    }
    const patch: Record<string, unknown> = {};
    if (nextWeights !== undefined) patch.weights = nextWeights;
    if (categoryWeights !== undefined) patch.categoryWeights = categoryWeights;
    if (activeSkillNames !== undefined) patch.activeSkillNames = activeSkillNames;
    if (activeRequirementNames !== undefined) patch.activeRequirementNames = activeRequirementNames;
    await ctx.db.patch(runId, patch);
    await ctx.scheduler.runAfter(0, internal.scoring.recalculate, { runId });
  },
});

export const retry = mutation({
  args: { queueId: v.id("matchQueue"), apiKey: v.string() },
  handler: async (ctx, { queueId, apiKey }) => {
    const row = await ctx.db.get(queueId);
    if (!row) throw new Error("Queue item not found.");
    await ctx.db.patch(queueId, { status: "PENDING", attempts: 0, error: undefined });
    await ctx.scheduler.runAfter(0, internal.matching.processQueue, { runId: row.runId, apiKey });
  },
});

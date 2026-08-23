import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const weights = v.object({ experience: v.number(), skills: v.number(), education: v.number(), other: v.number() });

export const start = mutation({
  args: { poolId: v.id("candidatePools"), jobId: v.id("jobDescriptions"), apiKey: v.string() },
  handler: async (ctx, { poolId, jobId, apiKey }) => {
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found.");
    const members = await ctx.db.query("poolMembers").withIndex("by_pool", (q) => q.eq("poolId", poolId)).collect();
    const policy = job.canonicalJson.weights;
    const runId = await ctx.db.insert("runs", {
      poolId, jobId, status: "MATCHING",
      weights: { experience: Number(policy.experience), skills: Number(policy.skills), education: Number(policy.education), other: Number(policy.other) },
      activeSkillNames: (job.canonicalJson.skills ?? []).map((s: { name: string }) => s.name), createdAt: Date.now(),
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
  args: { runId: v.id("runs"), weights, activeSkillNames: v.array(v.string()) },
  handler: async (ctx, { runId, weights: nextWeights, activeSkillNames }) => {
    const total = Object.values(nextWeights).reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - 100) > 0.01) throw new Error("Weights must sum to 100.");
    await ctx.db.patch(runId, { weights: nextWeights, activeSkillNames });
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
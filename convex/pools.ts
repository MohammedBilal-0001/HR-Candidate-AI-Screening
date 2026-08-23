import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("candidatePools").order("desc").collect() });
export const create = mutation({ args: { name: v.string(), description: v.optional(v.string()) }, handler: (ctx, args) => ctx.db.insert("candidatePools", { ...args, createdAt: Date.now() }) });
export const get = query({
  args: { poolId: v.id("candidatePools") },
  handler: async (ctx, { poolId }) => {
    const pool = await ctx.db.get(poolId);
    if (!pool) return null;
    const members = await ctx.db.query("poolMembers").withIndex("by_pool", (q) => q.eq("poolId", poolId)).collect();
    return { pool, members: (await Promise.all(members.map(async (m) => ({ ...m, candidate: await ctx.db.get(m.candidateId) })))).filter((m) => m.candidate) };
  },
});
export const addMember = mutation({ args: { poolId: v.id("candidatePools"), candidateId: v.id("candidates") }, handler: async (ctx, args) => {
  const existing = await ctx.db.query("poolMembers").withIndex("by_pool", (q) => q.eq("poolId", args.poolId)).collect();
  if (!existing.some((m) => m.candidateId === args.candidateId)) await ctx.db.insert("poolMembers", args);
}});
export const removeMember = mutation({ args: { poolId: v.id("candidatePools"), candidateId: v.id("candidates") }, handler: async (ctx, args) => {
  const rows = await ctx.db.query("poolMembers").withIndex("by_pool", (q) => q.eq("poolId", args.poolId)).collect();
  for (const row of rows.filter((m) => m.candidateId === args.candidateId)) await ctx.db.delete(row._id);
}});
export const uploadCvs = action({
  args: { poolId: v.id("candidatePools"), storageIds: v.array(v.id("_storage")), apiKey: v.string() },
  handler: async (ctx, { poolId, storageIds, apiKey }) => {
    const ids = [];
    for (const storageId of storageIds) {
      const candidateId = await ctx.runAction(internal.candidates.extractCv, { storageId, apiKey });
      await ctx.runMutation(internal.pools.addMemberInternal, { poolId, candidateId });
      ids.push(candidateId);
    }
    return ids;
  },
});
export const addMemberInternal = internalMutation({ args: { poolId: v.id("candidatePools"), candidateId: v.id("candidates") }, handler: async (ctx, args) => {
  const existing = await ctx.db.query("poolMembers").withIndex("by_pool", (q) => q.eq("poolId", args.poolId)).collect();
  if (!existing.some((m) => m.candidateId === args.candidateId)) await ctx.db.insert("poolMembers", args);
}});
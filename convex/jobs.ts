import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { callGeminiJson } from "./lib/gemini";

const jdSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    experience: {
      type: "OBJECT",
      properties: {
        minimumYears: { type: "NUMBER" },
        summary: { type: "STRING" },
      },
      required: ["minimumYears", "summary"],
    },
    skills: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          mandatory: { type: "BOOLEAN" },
          importance: { type: "NUMBER" },
        },
        required: ["name", "mandatory", "importance"],
      },
    },
    education: {
      type: "OBJECT",
      properties: {
        requirement: { type: "STRING" },
        mandatory: { type: "BOOLEAN" },
      },
      required: ["requirement", "mandatory"],
    },
    other: { type: "ARRAY", items: { type: "STRING" } },
    weights: {
      type: "OBJECT",
      properties: {
        experience: { type: "NUMBER" },
        skills: { type: "NUMBER" },
        education: { type: "NUMBER" },
        other: { type: "NUMBER" },
      },
      required: ["experience", "skills", "education", "other"],
    },
  },
  required: ["title", "experience", "skills", "education", "other", "weights"],
};
export const list = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("jobDescriptions").order("desc").collect(),
});
export const get = query({
  args: { jobId: v.id("jobDescriptions") },
  handler: (ctx, { jobId }) => ctx.db.get(jobId),
});
export const extractJd = action({
  args: { rawText: v.string(), apiKey: v.string() },
  handler: async (ctx, { rawText, apiKey }): Promise<any> => {
    const canonicalJson = await callGeminiJson(
      'You are an HR assistant. Convert the following job description into a structured hiring specification. Return ONLY valid JSON matching this schema: { "skills": [ { "name": "string", "mandatory": boolean (true only if JD text clearly states the skill as required, not if it says \'nice to have\', \'plus\', \'preferred\', or similar), "importance": number between 0.0 and 1.0 reflecting how central the skill is to the role based on the JD\'s own wording } ], "categoryWeights": { "experience": number, "skills": number, "education": number, "other": number } where the four weights must sum to exactly 100, and each reflects how much emphasis the JD places on that category (use your judgment from the text). Do not include any extra text, explanations, or markdown. Job description:',
      rawText,
      jdSchema,
      apiKey,
    );
    return await ctx.runMutation(internal.jobs.insert, {
      rawText,
      canonicalJson,
    });
  },
});
export const insert = internalMutation({
  args: { rawText: v.string(), canonicalJson: v.any() },
  handler: (ctx, { rawText, canonicalJson }) =>
    ctx.db.insert("jobDescriptions", {
      title: canonicalJson.title,
      rawText,
      canonicalJson,
      createdAt: Date.now(),
    }),
});
export const updateWeights = mutation({
  args: {
    jobId: v.id("jobDescriptions"),
    weights: v.object({
      experience: v.number(),
      skills: v.number(),
      education: v.number(),
      other: v.number(),
    }),
  },
  handler: async (ctx, { jobId, weights }) => {
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found.");
    await ctx.db.patch(jobId, {
      canonicalJson: { ...job.canonicalJson, weights },
    });
  },
});
export const updateSkills = mutation({
  args: {
    jobId: v.id("jobDescriptions"),
    skills: v.array(
      v.object({
        name: v.string(),
        mandatory: v.boolean(),
        importance: v.number(),
      }),
    ),
  },
  handler: async (ctx, { jobId, skills }) => {
    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found.");
    await ctx.db.patch(jobId, {
      canonicalJson: { ...job.canonicalJson, skills },
    });
  },
});

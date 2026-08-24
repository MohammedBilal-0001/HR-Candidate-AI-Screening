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
        minimum_years: { type: "NUMBER" },
        domains: { type: "ARRAY", items: { type: "STRING" } },
        mandatory: { type: "BOOLEAN" },
      },
      required: ["minimum_years", "domains", "mandatory"],
    },
    education: {
      type: "OBJECT",
      properties: {
        mandatory: { type: "BOOLEAN" },
        acceptable_fields: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["mandatory", "acceptable_fields"],
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
    other: {
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
  required: ["title", "experience", "education", "skills", "other", "weights"],
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
      'You are a job description parser. Convert the raw job description text into a JSON object that EXACTLY matches this schema — same field names, same nesting, same casing:\n{\n  "title": string,\n  "experience": {\n    "minimum_years": number,\n    "domains": string[],\n    "mandatory": boolean\n  },\n  "education": {\n    "mandatory": boolean,\n    "acceptable_fields": string[]\n  },\n  "skills": [\n    { "name": string, "mandatory": boolean, "importance": number }\n  ],\n  "other": [\n    { "name": string, "mandatory": boolean, "importance": number }\n  ],\n  "weights": {\n    "experience": number,\n    "skills": number,\n    "education": number,\n    "other": number\n  }\n}\n\nRules:\n- "mandatory" on a skill/education/experience item is true ONLY if the JD text clearly states it as required — words like "must have", "required", "at least X years". If the JD says "preferred", "nice to have", "a plus", or "bonus", mandatory is false.\n- "importance" is a number from 0.00 to 1.00 reflecting how central that skill is to the role, based on how the JD itself emphasizes it (order mentioned, repetition, phrasing like "strong" or "hands-on" vs. a passing mention). Mandatory skills should generally score higher than optional ones, but do not force this mechanically — base it on the actual JD wording.\n- "acceptable_fields" should list the degree fields the JD names, plus "related" if the JD uses language like "or related field".\n- "weights.experience" + "weights.skills" + "weights.education" + "weights.other" MUST sum to exactly 100. Distribute them based on how much of the JD\'s text and emphasis is spent on each area. If the JD barely mentions education, its weight should be low (e.g. 10-15), not a default 25.\n- Do not invent skills, domains, or requirements that are not stated or clearly implied in the JD text. Do not add commentary, explanation, or markdown — return only the JSON object.\n\nJob description:',
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

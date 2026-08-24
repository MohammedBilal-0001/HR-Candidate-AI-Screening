import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { callGeminiJson } from "./lib/gemini";

const candidateSchema = {
  type: "OBJECT", properties: {
    name: { type: "STRING" }, email: { type: "STRING" }, location: { type: "STRING" },
    education: { type: "ARRAY", items: { type: "OBJECT", properties: { degree: { type: "STRING" }, field: { type: "STRING" }, institution: { type: "STRING" } }, required: ["degree", "field", "institution"] } },
    totalYearsExperience: { type: "NUMBER" }, relevantYearsExperience: { type: "NUMBER" },
    experienceHistory: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, company: { type: "STRING" }, summary: { type: "STRING" } }, required: ["title", "company"] } },
    skills: { type: "ARRAY", items: { type: "STRING" } },
    projects: { type: "ARRAY", items: { type: "OBJECT", properties: { name: { type: "STRING" }, summary: { type: "STRING" }, skills: { type: "ARRAY", items: { type: "STRING" } } }, required: ["name", "summary", "skills"] } },
    extractionConfidence: { type: "NUMBER" },
  }, required: ["education", "totalYearsExperience", "experienceHistory", "skills", "projects", "extractionConfidence"],
};

export const list = query({ args: {}, handler: async (ctx) => ctx.db.query("candidates").order("desc").collect() });
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query: searchText }) => {
    const rows = await ctx.db.query("candidates").order("desc").collect();
    const q = searchText.trim().toLowerCase();
    if (!q) return rows.slice(0, 20);
    return rows.filter((c) => [c.name, c.email, c.location, ...c.skills].filter(Boolean).some((x) => x!.toLowerCase().includes(q))).slice(0, 20);
  },
});
export const get = query({ args: { candidateId: v.id("candidates") }, handler: (ctx, { candidateId }) => ctx.db.get(candidateId) });
export const insert = internalMutation({
  args: { sourceDocumentId: v.id("_storage"), profile: v.any() },
  handler: async (ctx, { sourceDocumentId, profile }) => ctx.db.insert("candidates", { sourceDocumentId, ...profile, createdAt: Date.now() }),
});
export const extractCv = action({
  args: { storageId: v.id("_storage"), apiKey: v.string() },
  handler: async (ctx, { storageId, apiKey }): Promise<any> => {
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Uploaded CV could not be found.");
    const response = await fetch(url);
    const bytes = new Uint8Array(await response.arrayBuffer());
    let text = new TextDecoder().decode(bytes);
    if (response.headers.get("content-type")?.includes("pdf") || bytes.slice(0, 4).toString() === "37,80,68,70") {
      const pdfParse = await import("pdf-parse");
      text = (await (pdfParse as any).default(Buffer.from(bytes))).text;
    }
    const profile = await callGeminiJson(
      "You extract structured data from a CV/resume. Return ONLY the requested JSON schema. Never guess a field you cannot support. Normalize obvious skill synonyms but do not invent skills.",
      text, candidateSchema, apiKey,
    );
    return await ctx.runMutation(internal.candidates.insert, { sourceDocumentId: storageId, profile });
  },
});
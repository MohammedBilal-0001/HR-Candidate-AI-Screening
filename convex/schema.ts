import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  candidates: defineTable({
    sourceDocumentId: v.optional(v.id("_storage")),
    rawText: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    location: v.optional(v.string()),
    education: v.array(v.object({ degree: v.string(), field: v.string(), institution: v.string() })),
    totalYearsExperience: v.number(),
    relevantYearsExperience: v.optional(v.number()),
    experienceHistory: v.array(v.object({ title: v.string(), company: v.string(), summary: v.optional(v.string()) })),
    skills: v.array(v.string()),
    projects: v.array(v.object({ name: v.string(), summary: v.string(), skills: v.array(v.string()) })),
    extractionConfidence: v.number(),
    createdAt: v.number(),
  }),
  candidatePools: defineTable({ name: v.string(), description: v.optional(v.string()), createdAt: v.number() }),
  poolMembers: defineTable({ poolId: v.id("candidatePools"), candidateId: v.id("candidates") }).index("by_pool", ["poolId"]),
  jobDescriptions: defineTable({ title: v.string(), rawText: v.string(), canonicalJson: v.any(), createdAt: v.number() }),
  runs: defineTable({
    poolId: v.id("candidatePools"), jobId: v.id("jobDescriptions"),
    status: v.union(v.literal("CREATED"), v.literal("MATCHING"), v.literal("SCORING"), v.literal("COMPLETED"), v.literal("PARTIAL")),
    weights: v.object({ experience: v.number(), skills: v.number(), education: v.number(), other: v.number() }),
    activeSkillNames: v.array(v.string()),
    activeRequirementNames: v.array(v.string()),
    createdAt: v.number(),
  }),
  matchQueue: defineTable({
    runId: v.id("runs"), candidateId: v.id("candidates"),
    status: v.union(v.literal("PENDING"), v.literal("PROCESSING"), v.literal("DONE"), v.literal("FAILED")),
    attempts: v.number(), error: v.optional(v.string()),
  }).index("by_run_status", ["runId", "status"]),
  matchAssessments: defineTable({
    runId: v.id("runs"), candidateId: v.id("candidates"), requirementName: v.string(),
    category: v.union(v.literal("skill"), v.literal("experience"), v.literal("education"), v.literal("other")),
    mandatory: v.boolean(), result: v.union(v.literal("MATCH"), v.literal("PARTIAL"), v.literal("NO_MATCH"), v.literal("UNKNOWN")),
    confidence: v.number(), evidence: v.optional(v.string()), reason: v.optional(v.string()), candidateYears: v.optional(v.number()),
  }).index("by_run_candidate", ["runId", "candidateId"]),
  candidateScores: defineTable({
    runId: v.id("runs"), candidateId: v.id("candidates"),
    eligibility: v.union(v.literal("ELIGIBLE"), v.literal("REVIEW"), v.literal("INELIGIBLE")),
    experienceContribution: v.number(), skillsContribution: v.number(), educationContribution: v.number(),
    otherContribution: v.number(), finalScore: v.number(), reviewReasons: v.array(v.string()), calculatedAt: v.number(),
  }).index("by_run", ["runId"]),
});
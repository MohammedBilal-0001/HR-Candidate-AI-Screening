/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as candidates from "../candidates.js";
import type * as jobs from "../jobs.js";
import type * as lib_gemini from "../lib/gemini.js";
import type * as lib_inputGuard from "../lib/inputGuard.js";
import type * as matching from "../matching.js";
import type * as pools from "../pools.js";
import type * as runs from "../runs.js";
import type * as scoring from "../scoring.js";
import type * as storage from "../storage.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  candidates: typeof candidates;
  jobs: typeof jobs;
  "lib/gemini": typeof lib_gemini;
  "lib/inputGuard": typeof lib_inputGuard;
  matching: typeof matching;
  pools: typeof pools;
  runs: typeof runs;
  scoring: typeof scoring;
  storage: typeof storage;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

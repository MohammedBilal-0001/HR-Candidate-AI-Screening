import { ConvexReactClient } from "convex/react";

const url = import.meta.env.VITE_CONVEX_URL ?? "https://third-fox-636.convex.cloud";
export const convex = new ConvexReactClient(url);
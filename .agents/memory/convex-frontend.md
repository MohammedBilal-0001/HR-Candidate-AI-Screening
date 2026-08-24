---
name: Convex frontend deployment
description: Convex functions live at the workspace root while the Vite app lives under an artifact.
---

The Convex client must be exposed to the artifact through a Vite alias and the workspace root must be included in Vite's filesystem allow list; otherwise generated Convex API imports compile but fail in preview.

**Why:** The monorepo artifact root is narrower than the workspace root, while Convex generates bindings outside the artifact.

**How to apply:** When adding a Convex-backed artifact, configure the alias and filesystem allow list before verifying the preview.
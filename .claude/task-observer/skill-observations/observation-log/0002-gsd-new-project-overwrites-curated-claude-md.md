---
id: 2
title: "gsd:new-project regenerates CLAUDE.md over a curated instruction file"
status: open
type: open-source
skill: [gsd:new-project]
proposes_skill: []
target_file: [".claude/get-shit-done/workflows/new-project.md"]
siblings_checked: "none — no skill-families.md registry exists; grep of .claude/get-shit-done/workflows/ finds generate-claude-md only in new-project.md; no sibling affected"
area: "Step 8, 'Generate or refresh project instruction file before final commit'"
date: 2026-09-24
session_context: "Initializing a brownfield GSD project whose CLAUDE.md holds hand-curated data-integrity rules"
parked_until:
resolved:
resolution:
reference:
---

**Issue:** Step 8 of the new-project workflow runs `gsd-sdk query generate-claude-md --output CLAUDE.md` unconditionally and commits it. Generated to a scratch path first, the output was 297 lines of sections rebuilt from PROJECT.md and the codebase map (stack, conventions, architecture, a "GSD Workflow Enforcement" block), versus an 88-line curated file of rules each learned from a past wrong result. The step gives no hint whether it merges or replaces, and it would triple the per-session context load with content already in `.planning/codebase/`. The step was skipped; a one-line pointer to `.planning/` was added by hand instead.

**Suggested improvement:** In Step 8, when an instruction file already exists and was not produced by GSD (no `GSD:*-start` markers), generate to a temp path, show the diff or a size comparison, and ask before writing; default to appending only a short pointer section. State in the step whether the command merges or replaces.

**Principle:** A workflow step that writes a file the user curated by hand must detect prior human authorship and default to append-or-ask, never regenerate, and it must say whether it merges or replaces before it runs.

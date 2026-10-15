---
id: 3
title: "discuss-phase scouts code but not the real input data, so unsatisfiable success criteria pass unnoticed"
status: open
type: open-source
skill: [gsd:discuss-phase]
proposes_skill: []
target_file: [".claude/get-shit-done/workflows/discuss-phase.md", ".claude/get-shit-done/references/scout-codebase.md"]
siblings_checked: "none — no skill-families.md registry; gsd:plan-phase researcher would also benefit but the gray-area moment is discuss-phase, so only it is listed"
area: "scout_codebase step and analyze_phase (gray area identification)"
date: 2026-09-24
session_context: "Discussing a data-reconciliation phase whose success criteria were written from docs before anyone looked at the actual input files"
parked_until:
resolved:
resolution:
reference:
---

**Issue:** The scout_codebase step reads codebase maps and code only. In a phase whose job is reconciling real input files, the decisive gray areas came from probing the input files' structure (section names, field labels, periods, count of adjustment rows, all values masked). That probe showed (a) one of the two statement formats has no field the roadmap's success criterion depends on, so the criterion "residual zero for every ingested statement" was unsatisfiable as written, and (b) the overlap rule in existing code drops period-cumulative adjustment rows, the probable root cause of the known bug. Neither was visible from the code maps or the research docs. Without the probe the gray areas would have been generic (tolerance, where to show it) and the planner would have inherited an impossible criterion.

**Suggested improvement:** In scout_codebase (or scout-codebase.md), add: when the phase consumes external data files (statements, exports, feeds), run a structure-only probe of the actual files — section/field names, periods, row counts, all numeric values masked — and check each success criterion against it before presenting gray areas. Flag any criterion that the observed data cannot satisfy as a gray area of its own. Include a masking rule so the probe never prints values.

**Principle:** Success criteria written from documentation must be checked against the shape of the real inputs before planning; a structure-only, value-masked probe of the data is part of scouting, not an implementation detail.

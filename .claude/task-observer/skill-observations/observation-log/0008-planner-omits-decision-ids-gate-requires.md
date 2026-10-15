---
id: 8
title: "plan-phase: the planner omits D-NN citations that the decision coverage gate requires, and gap-analysis reports other phases as gaps"
status: open
type: open-source
skill: [gsd:plan-phase]
proposes_skill: []
target_file: [".claude/get-shit-done/workflows/plan-phase.md"]
siblings_checked: "none — no skill-families.md registry; the same citation contract would apply to any gsd planner/verifier pair, noted in body"
area: "Step 8 planner prompt vs step 13a decision coverage gate; step 13e gap analysis"
date: 2026-09-25
session_context: "Planning a 13-plan phase with 30 locked discuss-phase decisions"
parked_until:
resolved:
resolution:
reference:
---

**Issue:** The plan checker verified that all 30 CONTEXT decisions were implemented, yet the step 13a decision coverage gate failed at 14/29, because it looks for literal D-NN ids in the plans and the planner prompt never asks for them. The orchestrator had to add traceability lines by hand. The gate's own "[informational]" tag only took effect in one specific position, found by trial. Step 13e gap-analysis then printed 67 "Not covered" rows that all belonged to other phases' requirements, which is noise that trains the reader to ignore the report.

**Suggested improvement:** In the step 8 planner prompt, require that every trackable D-NN from CONTEXT.md appear in some plan's must_haves.truths, stating the exact form the gate matches. Document the accepted [informational] syntax next to the gate. Scope gap-analysis to the phase's requirement ids.

**Principle:** When a later gate checks for a literal token, the producing step must be told to emit that token; a gate that checks something no instruction asked for fails on correct work and teaches operators to override it.

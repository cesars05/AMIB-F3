---
id: 4
title: "An unmasked structure probe printed a real value from a private statement"
status: open
type: internal
skill: []
proposes_skill: []
target_file: ["CLAUDE.md"]
siblings_checked: "none — no skill-families.md registry; target is the project instruction file, not a skill"
area: "Data rules: real IBKR statement contents are never printed"
date: 2026-09-24
session_context: "discuss-phase 1 (Portfolio Fixes), probing IBKR statement section names to find which cash fields exist"
parked_until:
resolved:
resolution:
reference:
---

**Issue:** The project rule (ROADMAP Phase 1 notes, CONCERNS.md) says real statement contents are never printed. While probing section and field names, a `cut -f3` over a NAV section's Data rows printed one real value (a period TWR percentage) into tool output, because the third column was a label in some rows and a value in others. It did not reach any committed file, but the protection in play was only "written down and loaded into context"; nothing mechanical masked values. A follow-up probe masked numbers with sed and was clean.

**Suggested improvement:** Add a small checked-in probe helper (e.g. `backend/ibkr_probe.py` or a script under the scratch area) that prints only section names, header field names, periods and row counts, and replaces every numeric-looking cell with `#`. Point CLAUDE.md's data rules at it: "probe IBKR files only through the helper, never raw grep/cut".

**Principle:** When a rule forbids printing private data, give the agent a probe tool that cannot print it; ad-hoc column slicing over mixed label/value rows leaks values sooner or later.

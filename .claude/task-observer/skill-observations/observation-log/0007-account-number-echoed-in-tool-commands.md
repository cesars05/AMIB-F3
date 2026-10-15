---
id: 7
title: "Unmasked greps over tracked source echoed the IBKR account number into tool output and a command line"
status: open
type: internal
skill: []
proposes_skill: []
target_file: ["CLAUDE.md", ".claude/agents/gsd-planner.md"]
siblings_checked: "sibling of 0004 (unmasked probe of a statement value); same class, different source: tracked code instead of a statement file. Any GSD agent that greps engine/config.py or the engine scripts is affected (planner, executor, researcher)"
area: "Data rules: the account number is never printed"
date: 2026-09-25
session_context: "plan-phase 1 (Portfolio Fixes), grepping callers of the IBKR folder constant and then counting tracked files that contain the account"
parked_until:
resolved:
resolution:
reference:
---

**Issue:** Two slips in one planning session. (1) A plain `grep -rn "CUENTA_IBKR|CARPETA_IBKR|ultimo_estado" engine` printed the line of `engine/config.py` that assigns the account number, so the value landed in tool output. (2) A follow-up `git grep -l` to count files holding the account was written with the literal digits in the command itself, which puts the value into the transcript a second time. Neither reached a committed file (the plans were scanned: zero matches), but the only guard was attention. The next check in the same session did it correctly: it read the value from the module inside Python and printed only counts.

**Suggested improvement:** Add to CLAUDE.md data rules: "Any grep over engine/ or backend/ source that can hit the account constant pipes through `sed -E 's/U[0-9]{5,}/U#/g'`; checks for the account read it from config/.env inside Python and print counts only; never type the digits in a command." Until the account moves to `.env` (Phase 1 plan 01-05), this is the only protection.

**Principle:** When a secret sits in tracked source, every read of that source is a potential print. Mask at the pipe, and when a check needs the value, load it inside the process instead of typing it.

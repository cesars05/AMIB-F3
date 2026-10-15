---
id: 12
title: "The mandated account-mask sed does not cover IBKR's own masked form, so a masked read still printed the real account tail"
status: open
type: internal
skill: []
proposes_skill: []
target_file: ["CLAUDE.md", ".claude/agents/gsd-executor.md"]
siblings_checked: "sibling of 0007 (account echoed by an unmasked grep) and 0004; same class, new gap in the mitigation itself"
area: "Data rules: the account number is never printed"
date: 2026-09-25
session_context: "execute-phase 1 plan 01-02, reading backend/ibkr_parser.py lines 1-50 as the plan's read_first required, piped through the mandated sed"
parked_until:
resolved:
resolution:
reference:
---

**Issue:** The run rules require every grep over engine/ or backend/ to pipe through `sed -E 's/U[0-9]{5,}/U#/g'`. The module docstring of `backend/ibkr_parser.py` holds IBKR's masked form: `U`, three asterisks, then the real trailing digits. The sed pattern needs digits right after `U`, so that line passed through unmasked and the real tail reached tool output. No committed file carries it. Plan 01-05 is scheduled to remove the docstring value (RESEARCH Pitfall 6), but until then every read of that file leaks it.

**Suggested improvement:** Widen the mandated mask to `sed -E 's/U[0-9*]{3,}[0-9]{2,}/U#/g'`, or to two passes: `U[0-9]{5,}` and `U\*+[0-9]+`. Put the widened pattern in CLAUDE.md and the orchestrator's run rules.

**Principle:** A mask is only as good as its coverage of every form the secret takes; the vendor's own partial mask is still a partial secret.

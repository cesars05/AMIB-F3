---
id: 10
title: "gsd-sdk state handlers: documented positional form rejected, silent no-ops, and a line-ending rewrite of REQUIREMENTS.md"
status: open
type: open-source
skill: []
proposes_skill: []
target_file: [".claude/agents/gsd-executor.md"]
siblings_checked: "sibling of 0005 (gsd-sdk commit drops the trailer): same class, a wrapper that the agent definition trusts without a post-condition. Every GSD agent that runs the state_updates block is affected; only the executor was observed"
area: "gsd-executor state_updates section (state.record-metric, state.add-decision, state.record-session, requirements.mark-complete)"
date: 2026-09-25
session_context: "Executing plan 01-01 of market-terminal Phase 1 on Windows; running the state_updates block exactly as the executor definition documents it"
parked_until:
resolved:
resolution:
reference:
---

**Issue:** Four defects in one run of the documented state-update block. Each one was caught only by reading `git diff` afterwards:
- `gsd-sdk query state.record-metric "01" "01" "15min" 3 15` (the positional form the agent definition shows) returned `"error": "phase, plan, and duration required"`. The flag form `--phase 01 --plan 01 --duration 15min --tasks 3 --files 15` worked.
- `state.add-decision "<text>"` ran twice and returned without error, but no decision line appeared in STATE.md. It is not established whether the argument form was wrong or the handler has a bug.
- `state.record-session "" "Completed 01-01-PLAN.md" "None"` updated the timestamp and the resume file but left `Stopped at` and the frontmatter `stopped_at` unchanged.
- `requirements.mark-complete FND-01 FND-02` rewrote the whole of REQUIREMENTS.md from CRLF to LF. A 4-line change became a 478-line diff.
- After these calls, STATE.md frontmatter kept `percent: 0` while the body progress bar read 8% and `completed_plans: 1`.

The agent then patched STATE.md with Python `write_text`. On Windows that converted the LF file to CRLF, which is the same class of problem from the agent's side. Reading the diff caught it too.

**Suggested improvement:** In the executor's state_updates section:
- Show the flag form for `state.record-metric`.
- Add a mandatory post-condition: after the block, run `git diff --stat .planning/` and `git diff --ignore-cr-at-eol --stat`, and confirm that each handler's intended line is present (decision bullets, Stopped at, requirement checkboxes).
- If line counts differ between the two diff views, restore the file's original line endings before committing.
- When patching planning files from Python on Windows, use `read_bytes`/`write_bytes` or `newline=""` to preserve line endings.

**Principle:** A state-mutation wrapper that returns success without a readable post-condition must be followed by a diff check. "No error" from a handler is not evidence that it wrote what was asked, and on Windows every rewrite of a text file is a potential line-ending rewrite.

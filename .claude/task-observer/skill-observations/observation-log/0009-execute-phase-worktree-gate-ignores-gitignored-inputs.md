---
id: 9
title: "execute-phase per-plan worktree gate checks only submodules, not gitignored inputs the plan reads or writes"
status: open
type: open-source
skill: [gsd:execute-phase]
proposes_skill: []
target_file: [".claude/get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md", ".claude/get-shit-done/workflows/execute-phase.md"]
siblings_checked: "none — no skill-families.md registry; gsd:quick and gsd:autonomous also dispatch executors in worktrees and would inherit the same gate, noted in body"
area: "execute_waves step 2.5, per-plan worktree decision"
date: 2026-09-25
session_context: "Executing a 13-plan phase whose plans move a live SQLite DB, append a secret to .env, move private statement files and measure against the real DB, all under gitignored paths"
parked_until:
resolved:
resolution:
reference:
---

**Issue:** The per-plan worktree decision forces sequential (main-tree) mode only when a plan's `files_modified` intersects a submodule path. A git worktree contains tracked files only, so any plan whose steps read or write gitignored paths (a local DB, `.env`, a data drop folder, a virtualenv) runs against files that do not exist in the worktree, or writes files that are destroyed when the worktree is removed. In this phase one plan removes a secret constant from tracked source and appends its value to `.env` in the same task: in a worktree the tracked removal merges to main while the `.env` write dies with the worktree, which breaks the main tree. Nothing in the gate or the plan frontmatter surfaced this; it was caught only by reading the plans and the `.gitignore` by hand before dispatch.

**Suggested improvement:** In step 2.5, after the submodule check, intersect each plan's `files_modified` and the paths named in its task actions with `git check-ignore` (or `git ls-files --others --ignored --exclude-standard --directory`); any hit forces `USE_WORKTREES_FOR_PLAN=false`. Optionally let the planner mark `touches_untracked: true` in plan frontmatter so the gate does not rely on text parsing. The same gate applies to gsd:quick and gsd:autonomous wherever they dispatch executors with isolation.

**Principle:** Isolation that copies only version-controlled state is safe only for work whose inputs and outputs are all version-controlled; any step touching ignored or local-only state must run where that state lives, and the dispatcher must check for it rather than assume.

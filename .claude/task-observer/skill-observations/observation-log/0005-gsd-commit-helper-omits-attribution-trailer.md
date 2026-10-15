---
id: 5
title: "gsd-sdk query commit drops the Co-Authored-By attribution trailer"
status: open
type: open-source
skill: []
proposes_skill: []
target_file: [".claude/agents/gsd-phase-researcher.md"]
siblings_checked: "none. Any GSD agent that commits through `gsd-sdk query commit` is likely affected (researcher, executor, planner); only the researcher was observed"
area: "Step 7, Commit Research"
date: 2026-09-25
session_context: "Phase 1 research for market-terminal; the agent committed RESEARCH.md with the prescribed `gsd-sdk query commit` call"
parked_until:
resolved:
resolution:
reference:
---

**Issue:** The harness requires every commit message to end with a `Co-Authored-By` trailer. The agent definition prescribes `gsd-sdk query commit "<msg>" --files ...`, which accepts only a one-line message. The resulting commit had no trailer, and the agent had to amend it by hand with `git commit --amend -m ... -m "Co-Authored-By: ..."`.

**Suggested improvement:** In the agent's commit step, either pass the trailer through the SDK (if it supports a body/trailer flag) or tell the agent to use `git commit -m "<msg>" -m "<trailer>"` whenever the harness supplies an attribution line.

**Principle:** A wrapper that owns the commit message must carry every harness-mandated part of that message, or the agent definition must say which parts it drops.

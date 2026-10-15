---
id: 6
title: "A literal U+FEFF reached a planning deliverable through Write; only a hook caught it"
status: open
type: internal
skill: []
proposes_skill: []
target_file: [".claude/agents/gsd-phase-researcher.md"]
siblings_checked: "none; any agent that writes code examples about BOM-prefixed files can hit this"
area: "Writing code examples that reference byte-order marks"
date: 2026-09-25
session_context: "Phase 1 research; a synthetic IBKR fixture example was meant to show the escape sequence for a BOM-prefixed first line"
parked_until:
resolved:
resolution:
reference:
---

**Issue:** The fixture example in RESEARCH.md was meant to contain the escape text for a BOM, but the written file held the invisible character itself. The PreToolUse hook flagged "invisible-unicode-characters" and a post-write scan confirmed one U+FEFF in a code block. A copied fixture would still have run, but the bytes differ from what a reader sees, and the character would travel into test files invisibly.

**Suggested improvement:** After writing any deliverable that discusses encodings, scan it for U+FEFF, zero-width characters and em-dashes (this project bans em-dashes in deliverables) before committing. A one-line Python check is enough.

**Principle:** When a document talks about an invisible character, write it as an escape sequence and verify the written bytes, because the editor view cannot show the difference.

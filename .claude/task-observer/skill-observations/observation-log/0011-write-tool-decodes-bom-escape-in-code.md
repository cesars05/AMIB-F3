---
id: 11
title: "Write turned the \\ufeff escape into a raw U+FEFF in Python test code, twice in one plan"
status: open
type: internal
skill: []
proposes_skill: []
target_file: [".claude/agents/gsd-executor.md", "CLAUDE.md"]
siblings_checked: "recurrence of 0006 (same mechanism, now in tracked .py code, not a planning doc); any agent writing BOM-related code or tests"
area: "Writing source files that reference byte-order marks"
date: 2026-09-25
session_context: "execute-phase 1 plan 01-02 (synthetic IBKR fixtures); the plan required the BOM as an escape in the Python source"
parked_until:
resolved:
resolution:
reference: "tests/fixtures_ibkr.py (commit 9e83c5b), tests/test_fixtures_ibkr.py (commit 73ece42)"
---

**Issue:** 0006 recorded one raw U+FEFF in a planning doc and suggested a post-write scan. This session shows it recurring in code: a single-backslash escape written through Write arrived on disk as the raw character every time (the layer that decodes it is not isolated; a doubled backslash inside a YAML string came through intact). `fixtures_ibkr.py` was written with the six-character escape and arrived holding one raw character. The test file was written with three escapes and arrived holding three raw characters. The plan's byte-check acceptance criterion caught both before commit, and a Python byte replacement fixed them. The Bash heredoc route mangled the backslash as well (`b'\\'` arrived as `b'\'`), so the working fix builds the escape from `bytes([92]) + b'ufeff'`.

**Suggested improvement:**
- Write files that must contain a BOM escape without it, then insert the escape with a Python byte-level edit built from `bytes([92])`. Alternatively, write the file and always run the replacement pass before committing.
- Keep `b.decode('ascii')` as the standing post-write check on any ASCII-only source.

**Principle:** A tool that decodes escapes on the way to disk cannot be trusted to write them. Verify the bytes, and build the escape where the tool cannot reinterpret it.

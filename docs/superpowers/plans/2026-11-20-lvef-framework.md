# LVEF Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a runnable, independent LVEF CLI that executes preview, screenshot, validation, and Git evidence workflows for Lumora and one independent project.

**Architecture:** A zero-build Node.js ESM CLI loads `lvef.project.json`, delegates work to stable adapters, and persists run reports under `.lvef/runs`. The core is cross-platform; browser and Windows desktop capture are replaceable adapters with honest capability statuses.

**Tech Stack:** Node.js 24, built-in `fetch`/child-process/fs APIs, optional Playwright, PowerShell for Windows capture probes, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-20-lvef-framework-design.md`

## Global Constraints

- Preserve all existing Lumora modifications; never use `git reset`, `git clean`, force push, or broad deletion.
- Keep `PASS`, `PARTIAL`, `FAIL`, `BLOCKED`, and `NOT_TESTED` distinct in code and reports.
- Do not claim real WebView2/mpv or GitHub synchronization without direct evidence.
- Do not publish a release or upload artifacts.

## Review Focus

- Missing or malformed project configuration must return a useful `FAIL` with field-level diagnostics.
- Preview commands that exit early, collide on a port, or fail health checks must be cleaned up and reported.
- Screenshot requests must distinguish browser evidence from real desktop-window evidence.
- Validation command failures and missing commands must retain stdout/stderr and exit status.
- Git checkpoint operations must refuse the Lumora remote and preserve unrelated worktree changes.

### Task 1: Core package and configuration

**Files:** Create `package.json`, `src/core/status.js`, `src/core/config.js`, `src/core/report.js`, `src/core/workflow.js`, tests under `test/core/`.

- [ ] Add failing tests for status aggregation, configuration loading, and report persistence.
- [ ] Implement config schema, status helpers, run IDs, evidence records, and JSON report writing.
- [ ] Run `node --test test/core/*.test.js` and verify pass.

### Task 2: Preview and command adapters

**Files:** Create `src/adapters/command.js`, `src/adapters/preview.js`, tests under `test/adapters/`.

- [ ] Test command success/failure capture and preview start/health/stop with a local fixture server.
- [ ] Implement owned child-process lifecycle, port checks, HTTP health checks, timeout handling, and cleanup.
- [ ] Run adapter tests and verify no fixture process remains.

### Task 3: Screenshot adapters

**Files:** Create `src/adapters/screenshot.js`, `src/adapters/windows-window.js`, tests under `test/adapters/`.

- [ ] Test browser adapter capability reporting and Windows adapter blocked evidence when no target is found.
- [ ] Implement optional Playwright page capture, PowerShell window probe/capture, validity checks, and evidence metadata.
- [ ] Run screenshot tests; label unavailable native/browser dependencies accurately.

### Task 4: Validation, Git, and workflow orchestration

**Files:** Create `src/adapters/validation.js`, `src/adapters/git.js`, `src/core/workflow.js`, tests under `test/integration/`.

- [ ] Test validation result classification, read-only Git inspection, remote safety guard, and full workflow aggregation.
- [ ] Implement command validation, Git status/diff/remote inspection, opt-in commit, and adapter sequencing.
- [ ] Run integration tests and verify report links all evidence.

### Task 5: CLI and project fixtures

**Files:** Create `src/cli.js`, `projects/lumora/lvef.project.json`, `projects/fixture-web/lvef.project.json`, `fixtures/web-server.mjs`, fixture assets, `.gitignore` rules.

- [ ] Add CLI smoke tests for `inspect`, `validate`, and `run`.
- [ ] Implement argument parsing, command help, project selection, and exit codes derived from status.
- [ ] Run the fixture workflow end to end and retain its report.

### Task 6: Stage reports and documentation

**Files:** Create `README.md`, `docs/architecture.md`, `docs/stages/stage-0.md` through `stage-9.md`, `docs/reports/2026-11-20-initial-run.md`.

- [ ] Document setup, project schema, adapter contracts, limitations, and evidence interpretation.
- [ ] Record actual Stage 0 environment evidence and Stage 1–8 implementation/validation states; mark real desktop and remote sync limitations explicitly.
- [ ] Run the full test command and final repository status inspection.

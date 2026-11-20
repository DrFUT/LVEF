# LVEF Framework Design

## Intent

LVEF is an independent, reusable engineering framework for the loop “modify code → preview → capture evidence → validate → checkpoint”. It must run without Lumora business code, while allowing Lumora and another project to provide project-specific commands and adapters.

## Goals

- Provide a runnable Node.js CLI and library under `Engineering/LVEF`.
- Load one explicit project configuration and produce machine-readable and human-readable run reports.
- Manage preview processes, health checks, browser or desktop screenshot adapters, validation commands, and Git checkpoint inspection through stable interfaces.
- Preserve `PASS`, `PARTIAL`, `FAIL`, `BLOCKED`, and `NOT_TESTED` states and evidence paths.
- Include a Lumora configuration and an independent sample web project configuration.
- Keep real WebView2 and native-window claims separate from browser or stub evidence.

## Non-goals

- Replacing Lumora's product architecture or build pipeline.
- Silently committing, pushing, publishing releases, or deleting artifacts.
- Claiming real WebView2/mpv acceptance when the environment cannot provide it.
- Adding a heavyweight GUI before the CLI workflow is useful.

## Constraints

- The parent repository contains unrelated uncommitted Lumora work; LVEF must not reset, clean, or overwrite it.
- The current remote is `https://github.com/DrFUT/Lumora.git`; no independent LVEF remote is configured, so GitHub sync remains inspectable but unperformed.
- Runtime should use the available Node.js 24 and built-in APIs wherever practical; optional Playwright integration may be used when installed.
- Reports must identify evidence type and limitations.

## Approaches considered

1. Product-local scripts would be fastest but would violate the independent-framework and Stage 8 requirements.
2. A Rust daemon would provide strong Windows process integration, but would slow cross-project iteration and require a separate distribution path before the core workflow is proven.
3. A Node.js/TypeScript-shaped CLI with JSON configuration and adapters keeps the core portable, makes process orchestration easy on Windows, and leaves native screenshot support behind a replaceable adapter. This is selected because it provides the shortest path to a real executable workflow while preserving later native adapters.

## Architecture

`src/core` contains status, configuration, reports, and workflow orchestration. `src/adapters` contains preview, screenshot, validation, and Git implementations. `src/cli.js` exposes commands (`inspect`, `preview`, `screenshot`, `validate`, `checkpoint`, `run`). A project declares commands and evidence capabilities in `lvef.project.json`; the framework never imports project business modules.

The first implementation uses child processes and HTTP health checks for preview, a Playwright adapter when the package is available, and a Windows PowerShell window-capture adapter that reports `BLOCKED` with a reason when no target window can be identified. Every adapter returns a common result object and writes evidence under `.lvef/runs/<run-id>`.

## Verification shape

Unit tests cover config validation, status aggregation, process lifecycle, command execution, and report persistence. An integration fixture starts a local HTTP server, runs the workflow, and verifies that report states and evidence links are honest. Lumora and independent-project checks remain separate configurations and are reported as `PASS`, `PARTIAL`, or `BLOCKED` according to actual environment evidence.

## Open implementation calls

- The CLI is JavaScript ESM for zero build bootstrap; public interfaces use JSDoc types and stable JSON shapes so a TypeScript wrapper can be added later.
- Preview processes are owned by a run-scoped manager and terminated on normal completion or explicit stop.
- Git checkpoint creation is opt-in via `--commit-message`; inspection is always read-only.

## Boundary decisions from builder review

- LVEF is implemented as an isolated subproject in this repository for now. It gets its own package metadata and configuration namespace; a separate GitHub remote is deferred until the owner supplies one.
- The core is cross-platform. Windows-specific HWND/WebView2 capture is an adapter, and a missing native capability is reported as `BLOCKED` or `PARTIAL` rather than hidden behind a browser screenshot.
- PowerShell and built-in Windows APIs are permitted for capture probes. A desktop screenshot is `PASS` only when a target process/window is located and a non-empty image is produced; otherwise the report includes the exact blocking reason.
- Stage 7 targets the current Lumora main worktree and its documented development command. Existing WebView2/mpv limitations remain evidence-backed `BLOCKED` until a real run succeeds.
- Stage 8 uses an in-repository static web fixture with a separate project configuration to prove that no Lumora module is required.
- GitHub sync has a dry-run adapter that refuses to push while the repository remote is Lumora or no dedicated LVEF remote is configured.

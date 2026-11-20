# LVEF architecture

The core has four stable boundaries:

- `src/core/config.js` loads and validates `lvef.project.json`.
- `src/core/report.js` persists run-scoped evidence under `.lvef/runs`.
- `src/adapters/preview.js` owns a child process and waits for an HTTP health URL.
- `src/adapters/screenshot.js`, `windows-window.js`, `validation.js`, and `git.js` implement replaceable evidence adapters.

`src/core/workflow.js` sequences adapters and aggregates statuses. The CLI is a thin JSON interface over that workflow. Adapters return objects with a `status` field and diagnostics; no adapter may infer success from a file existing alone.

The Windows adapter uses a temporary PowerShell script, Win32 window enumeration, and a screen capture. It is separate from the browser adapter so a browser screenshot cannot satisfy a desktop/WebView2 acceptance claim.

# Stage 7 — Lumora integration

**BLOCKED for real desktop acceptance; latest run is FAIL at the command layer.** A Lumora project configuration targets the current main worktree, `npm run tauri dev`, the local preview URL, and a desktop window title. The recorded run failed because the current root `package.json` has no `tauri` or `test` scripts; `cargo check --manifest-path src-tauri/Cargo.toml` did pass. Real WebView2/mpv creation and window capture were therefore not tested and cannot be promoted to PASS.

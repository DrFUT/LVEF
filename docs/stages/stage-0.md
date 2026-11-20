# Stage 0 — environment investigation

Evidence captured on 2026-11-20 (Asia/Shanghai): Node.js `v24.21.0`, npm `11.19.0`, Rust/Cargo `1.98.1`; the parent repository is `D:\MyCinema`, branch `main`, HEAD `7a0e0f5`, remote `https://github.com/DrFUT/Lumora.git`, with many unrelated uncommitted Lumora changes. The LVEF directory was empty before this implementation. Root dependencies include Playwright packages, but a real browser executable and WebView2 desktop control were not accepted as available without a direct run.

The environment supports Node child processes, HTTP health checks, optional Playwright, and PowerShell on Windows. Real Lumora WebView2/mpv window capture remains unverified and is reported separately from browser evidence.

# LVEF

Lumora Visual Engineering Framework is a small, independent CLI for the loop:

`modify → preview → capture evidence → validate → checkpoint`

It is implemented as a standalone project under `Engineering/LVEF`; it does not import Lumora business modules. The core uses Node.js built-ins and JSON project configuration. Optional Playwright support captures browser pages. Windows desktop capture uses a PowerShell/Win32 adapter and reports `BLOCKED` when no real target window can be found.

## Quick start

```powershell
cd D:\MyCinema\Engineering\LVEF
node src/cli.js inspect --project projects/fixture-web
node src/cli.js run --project projects/fixture-web --workspace projects/fixture-web
node --test
```

Each run writes `.lvef/runs/<run-id>/report.json`. A report includes per-step status, stdout/stderr, evidence paths, and limitations. `PASS`, `PARTIAL`, `FAIL`, `BLOCKED`, and `NOT_TESTED` are never collapsed into one success flag.

## Project configuration

`lvef.project.json` accepts `id`, `name`, `root`, a `preview` object (`command`, `healthUrl`, optional `startupTimeoutMs`), an optional `screenshot` object, and a `validation` array of `{name, command, cwd?, timeoutMs?}` entries. `root` is resolved relative to the configuration directory.

## Commands

- `inspect` loads configuration and performs read-only Git inspection.
- `run` starts the preview, runs the configured screenshot, runs validations, stops the owned preview process, and writes a report.
- `validate` uses the same evidence format with a validation command label.

Git checkpoint code is intentionally opt-in and refuses the current Lumora remote. No push or release operation is performed by LVEF.

## License

This repository is distributed under the terms in [`LICENSE`](LICENSE). The current repository is intended to remain private until its owner chooses otherwise.

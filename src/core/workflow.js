import path from 'node:path';
import { loadProjectConfig } from './config.js';
import { createRunReport, writeRunReport, addEvidence } from './report.js';
import { aggregateStatus } from './status.js';
import { PreviewManager } from '../adapters/preview.js';
import { captureBrowserPage } from '../adapters/screenshot.js';
import { captureWindowsWindow } from '../adapters/windows-window.js';
import { runValidation } from '../adapters/validation.js';

export async function runWorkflow({ projectRoot, workspaceRoot = projectRoot, command = 'run' }) {
  const config = await loadProjectConfig(projectRoot);
  const report = createRunReport({ projectId: config.id, command });
  const manager = new PreviewManager({ ...config.preview, cwd: config.root });
  const runDir = path.join(workspaceRoot, '.lvef', 'runs', report.runId);
  let previewStarted = false;
  try {
    const preview = await manager.start();
    previewStarted = preview.status === 'PASS';
    report.steps.push({ name: 'preview', status: preview.status, details: preview });
    addEvidence(report, { kind: 'preview', status: preview.status, details: preview });
    if (preview.status === 'PASS' && config.screenshot?.url) {
      const outputPath = path.join(runDir, 'screenshot.png');
      const shot = config.screenshot.type === 'desktop-window'
        ? await captureWindowsWindow({ ...config.screenshot, outputPath })
        : await captureBrowserPage({ ...config.screenshot, outputPath });
      report.steps.push({ name: 'screenshot', status: shot.status, details: shot });
      addEvidence(report, { kind: shot.type ?? 'screenshot', status: shot.status, path: shot.path, reason: shot.reason });
      if (shot.status === 'BLOCKED') report.limitations.push(shot.reason);
    } else {
      report.steps.push({ name: 'screenshot', status: 'NOT_TESTED', details: { reason: 'preview did not start or screenshot URL missing' } });
    }
    for (const spec of config.validation) {
      const validation = await runValidation({ ...spec, cwd: spec.cwd ? path.resolve(config.root, spec.cwd) : config.root });
      report.steps.push({ name: `validation:${spec.name}`, status: validation.status, details: validation });
      addEvidence(report, { kind: 'validation', name: spec.name, status: validation.status, stdout: validation.stdout, stderr: validation.stderr });
    }
  } finally {
    if (previewStarted) {
      const stopped = await manager.stop();
      report.steps.push({ name: 'preview-stop', status: stopped.status, details: stopped });
    }
  }
  report.status = aggregateStatus(report.steps.map((step) => step.status));
  const reportPath = await writeRunReport(workspaceRoot, report);
  return { report, reportPath };
}

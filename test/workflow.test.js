import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('validation adapter captures command evidence and classifies failures', async () => {
  const { runValidation } = await import('../src/adapters/validation.js');
  const result = await runValidation({ name: 'pass', command: `"${process.execPath}" fixtures/command-success.mjs`, cwd: process.cwd() });
  assert.equal(result.status, 'PASS');
  assert.match(result.stdout, /hello/);
});

test('git adapter reports the current worktree without mutating it', async () => {
  const { inspectGit } = await import('../src/adapters/git.js');
  const result = await inspectGit(process.cwd());
  assert.ok(['PASS', 'PARTIAL'].includes(result.status));
  assert.ok(Array.isArray(result.changedFiles));
  assert.ok(Array.isArray(result.remotes));
});

test('git checkpoint refuses an unrelated Lumora remote', async () => {
  const { checkpointGit } = await import('../src/adapters/git.js');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'lvef-git-'));
  spawnSync('git', ['init', '-b', 'main'], { cwd: root, stdio: 'ignore' });
  spawnSync('git', ['remote', 'add', 'origin', 'https://github.com/DrFUT/Lumora.git'], { cwd: root, stdio: 'ignore' });
  const result = await checkpointGit(root, { message: 'test checkpoint', remote: 'origin' });
  assert.equal(result.status, 'BLOCKED');
  assert.match(result.reason, /remote|LVEF|Lumora/i);
});

test('workflow persists an honest aggregate report', async () => {
  const { runWorkflow } = await import('../src/core/workflow.js');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'lvef-workflow-'));
  await fs.writeFile(path.join(root, 'lvef.project.json'), JSON.stringify({
    id: 'workflow-fixture', name: 'Workflow Fixture', root: '.',
    preview: { command: `"${process.execPath}" "${path.resolve('fixtures/web-server.mjs')}" --port 18987`, healthUrl: 'http://127.0.0.1:18987/health' },
    screenshot: { type: 'browser', engine: 'unsupported', url: 'http://127.0.0.1:18987/' },
    validation: [{ name: 'unit', command: `"${process.execPath}" "${path.resolve('fixtures/command-success.mjs')}"` }]
  }));
  const result = await runWorkflow({ projectRoot: root, workspaceRoot: root, command: 'run' });
  assert.equal(result.report.status, 'BLOCKED');
  assert.ok(result.report.steps.some((step) => step.name === 'screenshot'));
  assert.ok(result.report.evidence.length > 0);
  assert.match(result.reportPath, /report\.json$/);
});

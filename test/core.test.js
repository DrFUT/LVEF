import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('status aggregation preserves failure precedence and evidence counts', async () => {
  const { aggregateStatus } = await import('../src/core/status.js');
  assert.equal(aggregateStatus(['PASS', 'PARTIAL']), 'PARTIAL');
  assert.equal(aggregateStatus(['PASS', 'BLOCKED']), 'BLOCKED');
  assert.equal(aggregateStatus(['PASS', 'FAIL']), 'FAIL');
  assert.equal(aggregateStatus([]), 'NOT_TESTED');
});

test('loadProjectConfig validates required project fields and normalizes paths', async () => {
  const { loadProjectConfig } = await import('../src/core/config.js');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'lvef-config-'));
  await fs.writeFile(path.join(root, 'lvef.project.json'), JSON.stringify({
    id: 'fixture',
    name: 'Fixture',
    root: '.',
    preview: { command: 'node fixture.mjs', healthUrl: 'http://127.0.0.1:8787/health' },
    validation: [{ name: 'unit', command: 'node --test' }]
  }));
  const config = await loadProjectConfig(root);
  assert.equal(config.id, 'fixture');
  assert.equal(config.root, root);
  await assert.rejects(() => loadProjectConfig(path.join(root, 'missing')),
    /configuration file not found/);
});

test('run report persists status and evidence records as JSON', async () => {
  const { createRunReport, writeRunReport } = await import('../src/core/report.js');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'lvef-report-'));
  const report = createRunReport({ projectId: 'fixture', command: 'validate' });
  report.steps.push({ name: 'unit', status: 'PASS', evidence: [] });
  report.status = 'PASS';
  const file = await writeRunReport(root, report);
  const saved = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.equal(saved.projectId, 'fixture');
  assert.equal(saved.status, 'PASS');
  assert.match(file, /runs/);
});

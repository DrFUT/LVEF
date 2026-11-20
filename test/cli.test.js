import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

function cli(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ['src/cli.js', ...args], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('CLI inspect loads a project and prints JSON', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'lvef-cli-'));
  await fs.writeFile(path.join(root, 'lvef.project.json'), JSON.stringify({
    id: 'cli-fixture', name: 'CLI Fixture', preview: { command: 'node server.mjs', healthUrl: 'http://127.0.0.1:1/health' }
  }));
  const result = await cli(['inspect', '--project', root]);
  assert.equal(result.code, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.project.id, 'cli-fixture');
  assert.ok(parsed.git);
});

test('CLI returns non-zero and JSON report for a blocked run', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'lvef-cli-run-'));
  await fs.writeFile(path.join(root, 'lvef.project.json'), JSON.stringify({
    id: 'blocked-fixture', name: 'Blocked Fixture',
    preview: { command: `"${process.execPath}" "${path.resolve('fixtures/web-server.mjs')}" --port 19999`, healthUrl: 'http://127.0.0.1:19999/health' },
    screenshot: { type: 'browser', engine: 'unsupported', url: 'http://127.0.0.1:19999/' }
  }));
  const result = await cli(['run', '--project', root, '--workspace', root]);
  assert.equal(result.code, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, 'BLOCKED');
  assert.match(parsed.reportPath, /report\.json$/);
});

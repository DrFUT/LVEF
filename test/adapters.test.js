import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';

test('runCommand captures exit code, stdout, and stderr', async () => {
  const { runCommand } = await import('../src/adapters/command.js');
  const result = await runCommand(`"${process.execPath}" fixtures/command-success.mjs`);
  assert.equal(result.status, 'PASS');
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /hello/);
  assert.match(result.stderr, /warn/);
});

test('runCommand classifies a non-zero process as FAIL', async () => {
  const { runCommand } = await import('../src/adapters/command.js');
  const result = await runCommand(`"${process.execPath}" fixtures/command-fail.mjs`);
  assert.equal(result.status, 'FAIL');
  assert.equal(result.exitCode, 3);
});

test('PreviewManager starts, health checks, and stops an owned process', async () => {
  const { PreviewManager } = await import('../src/adapters/preview.js');
  const port = 18000 + Math.floor(Math.random() * 1000);
  const fixture = path.resolve('fixtures/web-server.mjs');
  const manager = new PreviewManager({
    command: `"${process.execPath}" "${fixture}" --port ${port}`,
    healthUrl: `http://127.0.0.1:${port}/health`,
    cwd: process.cwd(),
    startupTimeoutMs: 5000
  });
  const started = await manager.start();
  assert.equal(started.status, 'PASS');
  await delay(50);
  const health = await manager.healthCheck();
  assert.equal(health.status, 'PASS');
  const stopped = await manager.stop();
  assert.equal(stopped.status, 'PASS');
});

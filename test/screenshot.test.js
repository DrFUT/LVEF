import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

test('browser screenshot adapter reports unsupported engines as BLOCKED evidence', async () => {
  const { captureBrowserPage } = await import('../src/adapters/screenshot.js');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'lvef-shot-'));
  const result = await captureBrowserPage({
    url: 'http://127.0.0.1:1',
    outputPath: path.join(root, 'shot.png'),
    engine: 'unsupported'
  });
  assert.equal(result.status, 'BLOCKED');
  assert.match(result.reason, /unsupported/);
});

test('Windows window capture never claims PASS without a located target', async () => {
  const { captureWindowsWindow } = await import('../src/adapters/windows-window.js');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'lvef-window-'));
  const result = await captureWindowsWindow({
    title: 'LVEF impossible target 9c0f4c0c',
    outputPath: path.join(root, 'window.png')
  });
  assert.ok(['BLOCKED', 'FAIL'].includes(result.status));
  assert.ok(result.reason || result.error);
});

import { spawn } from 'node:child_process';

export function runCommand(command, options = {}) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env ?? {}) },
      shell: true,
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve({
        status: result.status,
        command,
        exitCode: result.exitCode ?? null,
        signal: result.signal ?? null,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
        error: result.error ?? null
      });
    };
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    child.once('error', (error) => finish({ status: 'FAIL', error: error.message }));
    child.once('close', (exitCode, signal) => finish({
      status: exitCode === 0 ? 'PASS' : 'FAIL', exitCode, signal
    }));
    if (options.timeoutMs) {
      setTimeout(() => {
        if (settled) return;
        child.kill();
        finish({ status: 'FAIL', error: `command timeout after ${options.timeoutMs}ms` });
      }, options.timeoutMs).unref();
    }
  });
}

export function spawnOwned(command, options = {}) {
  return spawn(command, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env ?? {}) },
    shell: true,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

export async function terminateProcess(child) {
  if (!child || child.exitCode !== null || child.killed) return;
  if (process.platform === 'win32' && child.pid) {
    await runCommand(`taskkill /PID ${child.pid} /T /F`, { timeoutMs: 5000 });
  } else {
    child.kill('SIGTERM');
  }
}

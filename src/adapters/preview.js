import { spawnOwned, terminateProcess } from './command.js';

async function waitForHealth(url, timeoutMs, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'health check did not run';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return { status: 'PASS', httpStatus: response.status };
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return { status: 'FAIL', error: `${lastError}; timeout after ${timeoutMs}ms` };
}

export class PreviewManager {
  constructor(options) {
    this.options = { startupTimeoutMs: 10000, ...options };
    this.child = null;
    this.output = { stdout: '', stderr: '' };
  }

  async start() {
    if (this.child && this.child.exitCode === null) {
      return { status: 'PARTIAL', message: 'preview already running', pid: this.child.pid };
    }
    this.child = spawnOwned(this.options.command, this.options);
    this.child.stdout?.on('data', (chunk) => { this.output.stdout += chunk.toString(); });
    this.child.stderr?.on('data', (chunk) => { this.output.stderr += chunk.toString(); });
    const health = await waitForHealth(this.options.healthUrl, this.options.startupTimeoutMs);
    if (health.status !== 'PASS') {
      await this.stop();
      return { ...health, command: this.options.command, output: this.output };
    }
    return { ...health, command: this.options.command, pid: this.child.pid, output: this.output };
  }

  async healthCheck() {
    return waitForHealth(this.options.healthUrl, this.options.healthTimeoutMs ?? 1500, 50);
  }

  async stop() {
    if (!this.child) return { status: 'PASS', message: 'preview was not running' };
    await terminateProcess(this.child);
    this.child = null;
    return { status: 'PASS', output: this.output };
  }
}

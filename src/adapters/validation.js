import { runCommand } from './command.js';

export async function runValidation(spec) {
  const result = await runCommand(spec.command, {
    cwd: spec.cwd,
    env: spec.env,
    timeoutMs: spec.timeoutMs
  });
  return { name: spec.name, ...result };
}

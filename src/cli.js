#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectConfig } from './core/config.js';
import { exitCodeForStatus } from './core/status.js';
import { runWorkflow } from './core/workflow.js';
import { inspectGit } from './adapters/git.js';

function usage() {
  return 'Usage: lvef <inspect|run|validate> --project <path> [--workspace <path>]';
}

function parseArgs(argv) {
  if (argv[0] === '--help' || argv[0] === '-h') return { command: 'help', help: true };
  const [command = 'help', ...rest] = argv;
  const values = { command };
  for (let i = 0; i < rest.length; i += 1) {
    const item = rest[i];
    if (item === '--project' || item === '--workspace') values[item.slice(2)] = rest[++i];
    else if (item === '--help' || item === '-h') values.help = true;
    else throw new Error(`unknown argument: ${item}`);
  }
  return values;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help || args.command === 'help') { console.log(usage()); return 0; }
  const projectRoot = path.resolve(args.project ?? process.cwd());
  if (args.command === 'inspect') {
    const config = await loadProjectConfig(projectRoot);
    const git = await inspectGit(config.root);
    console.log(JSON.stringify({ project: config, git }, null, 2));
    return 0;
  }
  if (!['run', 'validate'].includes(args.command)) throw new Error(`unknown command: ${args.command}`);
  const result = await runWorkflow({ projectRoot, workspaceRoot: path.resolve(args.workspace ?? projectRoot), command: args.command });
  console.log(JSON.stringify({ status: result.report.status, reportPath: result.reportPath, report: result.report }, null, 2));
  return exitCodeForStatus(result.report.status);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    console.error(JSON.stringify({ status: 'FAIL', error: error.message }));
    process.exitCode = 1;
  });
}

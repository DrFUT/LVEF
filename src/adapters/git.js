import { runCommand } from './command.js';

async function git(root, args) {
  const quotedRoot = `"${root.replaceAll('"', '\\"')}"`;
  return runCommand(`git -C ${quotedRoot} ${args}`, { cwd: root, timeoutMs: 15000 });
}

export async function inspectGit(root) {
  const [status, remotes, files] = await Promise.all([
    git(root, 'status --short --branch'),
    git(root, 'remote -v'),
    git(root, 'status --short')
  ]);
  if (status.status !== 'PASS' || remotes.status !== 'PASS' || files.status !== 'PASS') {
    return { status: 'FAIL', reason: status.stderr || remotes.stderr || files.stderr, changedFiles: [], remotes: [] };
  }
  const remoteLines = remotes.stdout.trim().split(/\r?\n/).filter(Boolean);
  const remoteMap = new Map();
  for (const line of remoteLines) {
    const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);
    if (!match) continue;
    const [, name, url, kind] = match;
    const item = remoteMap.get(name) ?? { name };
    item[kind] = url;
    remoteMap.set(name, item);
  }
  const changedFiles = files.stdout.trim() ? files.stdout.trim().split(/\r?\n/).map((line) => line.slice(3)) : [];
  return {
    status: 'PASS',
    branch: status.stdout.split(/\r?\n/, 1)[0],
    changedFiles,
    remotes: [...remoteMap.values()]
  };
}

export async function checkpointGit(root, { message, remote = 'origin', paths = [] } = {}) {
  const inspection = await inspectGit(root);
  const selected = inspection.remotes.find((item) => item.name === remote);
  if (!selected) return { status: 'BLOCKED', reason: `remote not found: ${remote}` };
  const remoteText = `${selected.fetch ?? ''} ${selected.push ?? ''}`.toLowerCase();
  if (!remoteText.includes('lvef') || remoteText.includes('lumora')) {
    return { status: 'BLOCKED', reason: `refusing checkpoint against non-LVEF remote: ${selected.fetch ?? selected.push}` };
  }
  if (!message || !paths.length) return { status: 'BLOCKED', reason: 'explicit commit message and file paths are required' };
  const add = await git(root, `add -- ${paths.map((item) => `"${item.replaceAll('"', '\\"')}"`).join(' ')}`);
  if (add.status !== 'PASS') return { status: 'FAIL', reason: add.stderr || add.error };
  const commit = await git(root, `commit -m "${message.replaceAll('"', '\\"')}"`);
  return { ...commit, status: commit.status, commitOutput: commit.stdout };
}

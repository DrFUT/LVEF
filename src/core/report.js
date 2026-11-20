import fs from 'node:fs/promises';
import path from 'node:path';

export function createRunId(now = new Date()) {
  return now.toISOString().replace(/[:.]/g, '-');
}

export function createRunReport({ projectId, command, runId = createRunId() }) {
  return {
    schemaVersion: 1,
    runId,
    projectId,
    command,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: 'NOT_TESTED',
    steps: [],
    evidence: [],
    limitations: []
  };
}

export async function writeRunReport(workspaceRoot, report) {
  const dir = path.join(path.resolve(workspaceRoot), '.lvef', 'runs', report.runId);
  await fs.mkdir(dir, { recursive: true });
  report.finishedAt ??= new Date().toISOString();
  const file = path.join(dir, 'report.json');
  await fs.writeFile(file, JSON.stringify(report, null, 2) + '\n', 'utf8');
  return file;
}

export function addEvidence(report, evidence) {
  report.evidence.push({ ...evidence, recordedAt: new Date().toISOString() });
  return evidence;
}

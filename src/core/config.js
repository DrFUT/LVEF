import fs from 'node:fs/promises';
import path from 'node:path';

function fail(message) {
  throw new Error(`invalid LVEF project configuration: ${message}`);
}

export async function loadProjectConfig(projectRoot, fileName = 'lvef.project.json') {
  const configDir = path.resolve(projectRoot);
  const file = path.join(configDir, fileName);
  let raw;
  try {
    raw = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`configuration file not found: ${file}`);
    throw new Error(`invalid LVEF project configuration JSON: ${error.message}`);
  }
  if (!raw || typeof raw !== 'object') fail('root must be an object');
  if (typeof raw.id !== 'string' || !raw.id.trim()) fail('id is required');
  if (typeof raw.name !== 'string' || !raw.name.trim()) fail('name is required');
  if (!raw.preview || typeof raw.preview !== 'object') fail('preview is required');
  if (typeof raw.preview.command !== 'string' || !raw.preview.command.trim()) fail('preview.command is required');
  if (typeof raw.preview.healthUrl !== 'string' || !raw.preview.healthUrl.trim()) fail('preview.healthUrl is required');
  if (raw.validation !== undefined && !Array.isArray(raw.validation)) fail('validation must be an array');
  const validation = (raw.validation ?? []).map((item, index) => {
    if (!item || typeof item.name !== 'string' || typeof item.command !== 'string') {
      fail(`validation[${index}] requires name and command`);
    }
    return { ...item };
  });
  const resolvedRoot = typeof raw.root === 'string' ? path.resolve(configDir, raw.root) : configDir;
  return {
    ...raw,
    root: resolvedRoot,
    id: raw.id.trim(),
    name: raw.name.trim(),
    validation,
    screenshot: raw.screenshot ?? { type: 'browser' }
  };
}

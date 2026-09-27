import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE_PATH = fileURLToPath(new URL('../data/seen-beatmapsets.json', import.meta.url));

export async function loadSeenBeatmapsets() {
  try {
    const content = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(content);
    return new Set(Array.isArray(parsed.ids) ? parsed.ids.map(String) : []);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return new Set();
    }

    throw error;
  }
}

export async function saveSeenBeatmapsets(ids) {
  await mkdir(dirname(STORE_PATH), { recursive: true });
  await writeFile(
    STORE_PATH,
    `${JSON.stringify({ ids: [...ids].sort() }, null, 2)}\n`,
    'utf8',
  );
}

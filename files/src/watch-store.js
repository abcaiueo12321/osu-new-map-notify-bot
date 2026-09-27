import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOsuUserIds, requireEnv } from './config.js';

const STORE_PATH = fileURLToPath(new URL('../data/watch-config.json', import.meta.url));

async function readStoredUserIds() {
  try {
    const content = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.userIds) ? parsed.userIds.map(String).map((id) => id.trim()).filter(Boolean) : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export async function loadWatchedUserIds() {
  const storedUserIds = await readStoredUserIds();

  if (storedUserIds !== null) {
    return storedUserIds;
  }

  return parseOsuUserIds(process.env.OSU_USER_IDS);
}

async function saveWatchedUserIds(userIds) {
  await mkdir(dirname(STORE_PATH), { recursive: true });
  await writeFile(
    STORE_PATH,
    `${JSON.stringify({ userIds: [...new Set(userIds)].sort() }, null, 2)}\n`,
    'utf8',
  );
}

export async function addWatchedUserId(userId) {
  const userIds = await loadWatchedUserIds();

  if (userIds.includes(userId)) {
    return { added: false, userIds };
  }

  userIds.push(userId);
  await saveWatchedUserIds(userIds);
  return { added: true, userIds };
}

export async function removeWatchedUserId(userId) {
  const userIds = await loadWatchedUserIds();
  const nextUserIds = userIds.filter((id) => id !== userId);

  if (nextUserIds.length === userIds.length) {
    return { removed: false, userIds };
  }

  await saveWatchedUserIds(nextUserIds);
  return { removed: true, userIds: nextUserIds };
}

export function validateWatchedUserId(value) {
  return /^\d+$/.test(value) && Number(value) > 0;
}

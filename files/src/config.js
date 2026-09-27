export function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} in .env`);
  }

  return value;
}

export function parseOsuUserIds(value) {
  if (!value) {
    return [];
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed);

    if (!Array.isArray(parsed)) {
      throw new Error('OSU_USER_IDS JSON value must be an array');
    }

    return parsed.map(String).map((id) => id.trim()).filter(Boolean);
  }

  return trimmed
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export function getPollIntervalMs() {
  const seconds = Number(process.env.OSU_POLL_INTERVAL_SECONDS ?? 300);

  if (!Number.isFinite(seconds) || seconds < 60) {
    throw new Error('OSU_POLL_INTERVAL_SECONDS must be at least 60');
  }

  return seconds * 1000;
}

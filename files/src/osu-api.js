import { requireEnv } from './config.js';

const OSU_TOKEN_URL = 'https://osu.ppy.sh/oauth/token';
const OSU_API_BASE_URL = 'https://osu.ppy.sh/api/v2';

let cachedToken = null;
let tokenExpiresAt = 0;

export async function getOsuAccessToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const response = await fetch(OSU_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: Number(requireEnv('OSU_CLIENT_ID')),
      client_secret: requireEnv('OSU_CLIENT_SECRET'),
      grant_type: 'client_credentials',
      scope: 'public',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to get osu! access token: ${response.status} ${body}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;

  return cachedToken;
}

export async function getUserBeatmapsets(userId, type, limit = 10) {
  const token = await getOsuAccessToken();
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(
    `${OSU_API_BASE_URL}/users/${encodeURIComponent(userId)}/beatmapsets/${encodeURIComponent(type)}?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to get osu! beatmapsets for ${userId}: ${response.status} ${body}`);
  }

  return response.json();
}

export async function getUserPendingBeatmapsets(userId, limit = 10) {
  return getUserBeatmapsets(userId, 'pending', limit);
}

export async function getUserLatestPendingBeatmapset(userId) {
  const [pending, graveyard] = await Promise.all([
    getUserBeatmapsets(userId, 'pending', 10),
    getUserBeatmapsets(userId, 'graveyard', 10),
  ]);

  return [...pending, ...graveyard]
    .sort((left, right) => {
      const leftDate = new Date(left.submitted_date ?? 0).getTime();
      const rightDate = new Date(right.submitted_date ?? 0).getTime();
      return rightDate - leftDate;
    })[0] ?? null;
}

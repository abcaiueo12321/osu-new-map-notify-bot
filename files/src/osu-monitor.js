import { EmbedBuilder } from 'discord.js';
import { requireEnv } from './config.js';
import { getUserPendingBeatmapsets } from './osu-api.js';
import { loadSeenBeatmapsets, saveSeenBeatmapsets } from './seen-store.js';
import { loadWatchedUserIds } from './watch-store.js';

function formatBeatmapsetUrl(beatmapsetId) {
  return `https://osu.ppy.sh/beatmapsets/${beatmapsetId}`;
}

function createBeatmapsetEmbed(beatmapset, userId) {
  const title = [beatmapset.artist, beatmapset.title].filter(Boolean).join(' - ');
  const creator = beatmapset.creator || `osu! user ${userId}`;

  return new EmbedBuilder()
    .setColor(0xff66aa)
    .setTitle(title || `Beatmapset ${beatmapset.id}`)
    .setURL(formatBeatmapsetUrl(beatmapset.id))
    .setDescription(`New pending beatmap uploaded by ${creator}`)
    .addFields(
      { name: 'Status', value: beatmapset.status ?? 'pending', inline: true },
      { name: 'Submitted', value: beatmapset.submitted_date ?? 'unknown', inline: true },
    );
}

export async function checkOsuUploads(client, seenBeatmapsetIds) {
  const channelId = requireEnv('DISCORD_NOTIFY_CHANNEL_ID');
  const userIds = await loadWatchedUserIds();

  if (userIds.length === 0) {
    throw new Error('OSU_USER_IDS must contain at least one user id');
  }

  const channel = await client.channels.fetch(channelId);

  if (!channel?.isTextBased()) {
    throw new Error(`Discord channel ${channelId} is not a text channel`);
  }

  let changed = false;

  for (const userId of userIds) {
    const beatmapsets = await getUserPendingBeatmapsets(userId);
    const newestFirst = [...beatmapsets].sort((a, b) => {
      return new Date(a.submitted_date ?? 0) - new Date(b.submitted_date ?? 0);
    });

    for (const beatmapset of newestFirst) {
      const beatmapsetId = String(beatmapset.id);

      if (seenBeatmapsetIds.has(beatmapsetId)) {
        continue;
      }

      seenBeatmapsetIds.add(beatmapsetId);
      changed = true;

      await channel.send({
        content: formatBeatmapsetUrl(beatmapset.id),
        embeds: [createBeatmapsetEmbed(beatmapset, userId)],
      });
    }
  }

  if (changed) {
    await saveSeenBeatmapsets(seenBeatmapsetIds);
  }
}

export async function initializeSeenBeatmapsets() {
  const seenBeatmapsetIds = await loadSeenBeatmapsets();

  if (seenBeatmapsetIds.size > 0) {
    return seenBeatmapsetIds;
  }

  const userIds = await loadWatchedUserIds();

  for (const userId of userIds) {
    const beatmapsets = await getUserPendingBeatmapsets(userId);

    for (const beatmapset of beatmapsets) {
      seenBeatmapsetIds.add(String(beatmapset.id));
    }
  }

  await saveSeenBeatmapsets(seenBeatmapsetIds);
  return seenBeatmapsetIds;
}

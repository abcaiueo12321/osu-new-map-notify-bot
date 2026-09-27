import dotenv from 'dotenv';
import { Client, EmbedBuilder, Events, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'node:url';
import { getPollIntervalMs } from './config.js';
import { checkOsuUploads, initializeSeenBeatmapsets } from './osu-monitor.js';
import { getUserLatestPendingBeatmapset } from './osu-api.js';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

function formatLength(seconds) {
  if (!Number.isFinite(seconds)) {
    return '不明';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);

  if (!process.env.OSU_CLIENT_ID) {
    console.log('osu! monitor is disabled. Set OSU_CLIENT_ID to enable it.');
    return;
  }

  let pollIntervalMs;
  let seenBeatmapsetIds;

  try {
    pollIntervalMs = getPollIntervalMs();
    seenBeatmapsetIds = await initializeSeenBeatmapsets();
  } catch (error) {
    console.error('Failed to start osu! monitor:', error);
    return;
  }

  console.log(`osu! monitor started for ${process.env.OSU_USER_IDS}`);

  const runCheck = async () => {
    try {
      await checkOsuUploads(readyClient, seenBeatmapsetIds);
    } catch (error) {
      console.error('osu! monitor check failed:', error);
    }
  };

  setInterval(runCheck, pollIntervalMs);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
    return;
  }

  if (interaction.commandName === 'hello') {
    await interaction.reply(`Hello, ${interaction.user.username}!`);
    return;
  }

  if (interaction.commandName === 'lastmap') {
    const userInput = interaction.options.getString('user', true).trim();
    const user = /^\d+$/.test(userInput)
      ? userInput
      : (userInput.startsWith('@') ? userInput : `@${userInput}`);

    if (!userInput || user.length < 2) {
      await interaction.reply({
        content: 'osu! User IDまたはユーザー名を指定してください。',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    try {
      const beatmapset = await getUserLatestPendingBeatmapset(user);

      if (!beatmapset) {
        await interaction.editReply(`${userInput} の投稿中beatmapは見つかりませんでした。`);
        return;
      }

      const artist = beatmapset.artist ?? '不明';
      const title = beatmapset.title ?? '無題';
      const creator = beatmapset.creator ?? '不明';
      const status = beatmapset.status ?? 'pending';
      const thumbnailUrl = beatmapset.covers?.card ?? beatmapset.covers?.cover;
      const submittedAt = beatmapset.submitted_date
        ? `<t:${Math.floor(new Date(beatmapset.submitted_date).getTime() / 1000)}:R>`
        : '不明';
      const difficultyLines = (beatmapset.beatmaps ?? []).map((beatmap) => {
        const difficulty = beatmap.version ?? '不明';
        const stars = Number.isFinite(beatmap.difficulty_rating)
          ? `★${beatmap.difficulty_rating.toFixed(2)}`
          : '★不明';

        return `**${difficulty}** | ${stars} | ${formatLength(beatmap.total_length)} | CS ${beatmap.cs ?? '-'} / AR ${beatmap.ar ?? '-'} / OD ${beatmap.accuracy ?? '-'} / HP ${beatmap.drain ?? '-'}`;
      });

      const embed = new EmbedBuilder()
        .setTitle(`${artist} - ${title}`)
        .setURL(`https://osu.ppy.sh/beatmapsets/${beatmapset.id}`)
        .setDescription(`osu! user: ${userInput}`)
        .addFields(
          { name: 'Mapper', value: creator, inline: true },
          { name: 'Status', value: status, inline: true },
          { name: '投稿日時', value: submittedAt, inline: true },
        )
        .setColor(0xff66ab);

      if (difficultyLines.length > 0) {
        embed.addFields({
          name: 'Difficulty | Length | CS / AR / OD / HP',
          value: difficultyLines.join('\n').slice(0, 1024),
        });
      }

      if (thumbnailUrl) {
        embed.setThumbnail(thumbnailUrl);
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`Failed to fetch latest beatmapset for ${userInput}:`, error);
      await interaction.editReply('osu!からbeatmap情報を取得できませんでした。User IDまたはユーザー名を確認してください。');
    }
  }
});

client.login(token);

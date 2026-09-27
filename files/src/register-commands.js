import dotenv from 'dotenv';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error('Missing DISCORD_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID in .env');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong.'),
  new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Says hello to you.'),
  new SlashCommandBuilder()
    .setName('lastmap')
    .setDescription('Returns the latest pending or graveyard beatmapset for an osu! user.')
    .addStringOption((option) => option
      .setName('user')
      .setDescription('osu! user ID or username')
      .setRequired(true)),
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

try {
  console.log('Registering slash commands...');

  await rest.put(
    Routes.applicationGuildCommands(clientId, guildId),
    { body: commands },
  );

  console.log('Slash commands registered.');
} catch (error) {
  console.error(error);
  process.exit(1);
}

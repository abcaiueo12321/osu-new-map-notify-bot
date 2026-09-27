# Discord Bot

`discord.js` を使った最小構成の Discord bot です。

## セットアップ

1. Discord Developer Portal でアプリケーションを作成します。
2. `Bot` ページで bot を作成し、token をコピーします。
3. `OAuth2` -> `URL Generator` で以下を選び、生成された URL から bot をサーバーに招待します。
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: 必要に応じて選択。最初は権限なしでも `/ping` は動きます。
4. `bot/.env` を作成して値を入れます。`.env.example`は`bot/files/.env.example`にあります。

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_client_id_here
DISCORD_GUILD_ID=your_test_server_id_here
DISCORD_NOTIFY_CHANNEL_ID=your_notify_channel_id_here

OSU_CLIENT_ID=your_osu_client_id_here
OSU_CLIENT_SECRET=your_osu_client_secret_here
OSU_USER_IDS=123456,789012
OSU_POLL_INTERVAL_SECONDS=300
```

`OSU_USER_IDS` はカンマ区切り、または JSON 配列で指定できます。

```env
OSU_USER_IDS=123456,789012
```

```env
OSU_USER_IDS=["123456","789012"]
```

## 実行

依存関係をインストールします。

```bash
cd files
npm install
```

スラッシュコマンドをテストサーバーに登録します。

```bash
npm run register
```

このPCで `node` が見つからない場合は PowerShell でこちらを使えます。

```powershell
.\files\register-commands.ps1
```

bot を起動します。

```bash
npm start
```

このPCで `node` が見つからない場合は PowerShell でこちらを使えます。

```powershell
.\files\start-bot.ps1
```

Discord 上で `/ping` または `/hello` を実行できます。

osu! 監視を有効にすると、指定した複数ユーザーの pending beatmapset を定期チェックし、新しい beatmapset があれば `DISCORD_NOTIFY_CHANNEL_ID` のチャンネルへ送信します。初回起動時は現在存在する beatmapset を既読として保存し、次回以降に増えたものだけ通知します。

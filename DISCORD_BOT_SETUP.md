# Discord Bot Setup Guide

## Prerequisites
- Node.js installed
- Discord account
- Exaroton API token

## Step 1: Create Discord Application

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Give it a name (e.g., "Exaroton Bot")
4. Go to the "Bot" section in the left sidebar
5. Click "Add Bot"
6. Under "Token", click "Reset Token" and copy it
7. Save this as `DISCORD_BOT_TOKEN` in your `.env` file

## Step 2: Get Client ID

1. In the same application, go to "General Information"
2. Copy the "Application ID"
3. Save this as `DISCORD_CLIENT_ID` in your `.env` file

## Step 3: Configure Bot Permissions

1. Go to "Bot" section
2. Under "Privileged Gateway Intents", enable:
   - Message Content Intent (if you want to use message commands)
3. Under "Bot Permissions", select:
   - Send Messages
   - Use Slash Commands
   - Embed Links

## Step 4: Invite Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Under "Scopes", select:
   - `bot`
   - `applications.commands`
3. Under "Bot Permissions", select:
   - Send Messages
   - Use Slash Commands
   - Embed Links
4. Copy the generated URL at the bottom
5. Open the URL in your browser
6. Select your server and authorize

## Step 5: Configure Environment

Edit your `.env` file:
```env
EXAROTON_API_TOKEN=your_exaroton_token
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_application_id
DEFAULT_SERVER_ID=your_default_server_id_optional
```

## Step 6: Install Dependencies

```bash
npm install
```

## Step 7: Start the Bot

```bash
npm run bot
```

Or for development with auto-reload:
```bash
npm run bot:dev
```

## Available Commands

Once the bot is running, use these slash commands in Discord:

### Server Management
- `/servers` - List all available servers
- `/status [server]` - Get server status
- `/start [server]` - Start the server
- `/stop [server]` - Stop the server
- `/restart [server]` - Restart the server

### Server Information
- `/players [server]` - Get online players
- `/ram [server] [amount]` - Get or set server RAM (2-16 GB)

### Administration
- `/console <command> [server]` - Execute a console command

**Note:** The `[server]` parameter is optional if you set `DEFAULT_SERVER_ID` in `.env`

## Usage Examples

```
/status
/start
/stop
/players
/ram amount:4
/console command:say Hello World!
```

With specific server:
```
/status server:abc123xyz
/start server:abc123xyz
```

## Troubleshooting

### Bot doesn't respond
- Check the bot is online in your server
- Verify the bot has proper permissions
- Check console for errors

### "No server ID provided"
- Either provide a server ID in the command
- Or set DEFAULT_SERVER_ID in your .env file

### "Unknown command"
- Wait a few minutes for Discord to register the slash commands
- Try kicking and re-inviting the bot

### Permission errors
- Make sure the bot has "Send Messages" and "Use Slash Commands" permissions
- Check the role permissions in your Discord server

## Security Notes

- Never share your Discord bot token
- Never commit `.env` file to git
- Use role permissions in Discord to restrict who can use bot commands
- Consider adding administrator checks for destructive commands

## Running Both Web Dashboard and Bot

Terminal 1 (Web Dashboard):
```bash
npm run dev
```

Terminal 2 (Discord Bot):
```bash
npm run bot
```

Both can run simultaneously using the same Exaroton API token.

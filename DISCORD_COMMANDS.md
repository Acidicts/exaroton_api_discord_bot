# Discord Bot Quick Reference

## 🚀 Setup Checklist

1. ✅ Create Discord application at https://discord.com/developers/applications
2. ✅ Copy Bot Token → `DISCORD_BOT_TOKEN` in `.env`
3. ✅ Copy Application ID → `DISCORD_CLIENT_ID` in `.env`
4. ✅ Enable "Message Content Intent" in Bot settings
5. ✅ Invite bot to your server (use OAuth2 URL Generator)
6. ✅ Set `DEFAULT_SERVER_ID` in `.env` (optional)
7. ✅ Run `npm run bot`

## 📋 Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `/servers` | List all available servers | `/servers` |
| `/status [server]` | Get detailed server status | `/status` or `/status server:abc123` |
| `/start [server]` | Start the server | `/start` or `/start server:abc123` |
| `/stop [server]` | Stop the server | `/stop` |
| `/restart [server]` | Restart the server | `/restart` |
| `/players [server]` | View online players | `/players` |
| `/ram [server] [amount]` | Get or set RAM (2-16 GB) | `/ram` or `/ram amount:4` |
| `/console <command> [server]` | Execute console command | `/console command:say Hello!` |

## 🎯 Quick Examples

**Start your default server:**
```
/start
```

**Check status of specific server:**
```
/status server:abc123xyz
```

**Set RAM to 4GB:**
```
/ram amount:4
```

**Execute console command:**
```
/console command:say Welcome to the server!
```

**View all servers:**
```
/servers
```

## 🎨 Bot Features

- ✨ Rich embed responses with color-coded status
- 🟢 Green for success operations
- 🔴 Red for stop operations
- 🟡 Yellow for restart operations
- 🔵 Blue for informational commands
- ⏱️ Timestamps on all responses
- 🆔 Server ID shown in footers
- 🎮 Activity status: "Watching Exaroton Servers"

## 🔒 Security Tips

- Never share your bot token
- Use Discord role permissions to restrict bot usage
- Consider creating a dedicated admin channel for bot commands
- Set up audit logging in Discord for bot actions

## 🐛 Troubleshooting

**Bot is offline:**
- Check console for errors
- Verify bot token is correct
- Ensure bot has internet connection

**Commands don't appear:**
- Wait 5-10 minutes for Discord to sync
- Kick and re-invite the bot
- Check bot has "applications.commands" scope

**"No server ID provided" error:**
- Set `DEFAULT_SERVER_ID` in `.env`
- Or specify server ID in command: `/start server:yourID`

**"Insufficient permissions" errors:**
- Verify Exaroton API token has proper permissions
- Check server is accessible with your API token

## 💡 Pro Tips

1. **Set a default server** in `.env` to avoid typing server IDs
2. **Run with `npm run bot:dev`** for auto-reload during development
3. **Check console logs** for detailed error messages
4. **Use Discord's permission system** to control who can execute commands
5. **Both web dashboard and bot** can run simultaneously

## 🔄 Running Both Services

**Terminal 1 - Web Dashboard:**
```bash
npm run dev
```

**Terminal 2 - Discord Bot:**
```bash
npm run bot:dev
```

Both services use the same Exaroton API and can control the same servers!

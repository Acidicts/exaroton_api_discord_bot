# Exaroton Control Dashboard

A comprehensive Node.js API system with a web-based control dashboard and Discord bot for managing Exaroton Minecraft servers.

## Features

### Web Dashboard
- 🎮 **Server Management**: Start, stop, and restart servers
- 📊 **Real-time Monitoring**: Live server status, TPS, heap usage, and player count
- 💬 **Console Access**: View console output and execute commands
- 👥 **Player Management**: Manage whitelists, operators, and bans
- ⚙️ **Configuration**: Adjust RAM and MOTD settings
- 📝 **Logs**: View and share server logs
- 🔄 **WebSocket Updates**: Real-time server updates via WebSocket
- 🎨 **Modern UI**: Compact, dark-themed, responsive dashboard

### Discord Bot
- 🤖 **Slash Commands**: Easy-to-use Discord slash commands
- ⚡ **Quick Control**: Start/stop/restart servers from Discord
- 📈 **Status Checks**: Check server status and player count
- 🎮 **Console Commands**: Execute server commands remotely
- 📊 **Server Info**: View detailed server information with embeds

## Prerequisites

- Node.js 16.x or higher
- Exaroton account with API token
- Active Exaroton server(s)

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Exaroton API token:
```env
EXAROTON_API_TOKEN=your_api_token_here
PORT=3000
NODE_ENV=development
DEFAULT_SERVER_ID=your_server_id_optional
```

To get your API token:
- Visit https://exaroton.com/account/
- Navigate to the "API" section
- Generate a new API token

## Usage

### Web Dashboard

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Access the dashboard at: http://localhost:3000

### Discord Bot

See [DISCORD_BOT_SETUP.md](DISCORD_BOT_SETUP.md) for detailed setup instructions.

Start the bot:
```bash
npm run bot
```

Development mode:
```bash
npm run bot:dev
```

**Discord Commands:**
- `/servers` - List all servers
- `/status [server]` - Get server status
- `/start [server]` - Start server
- `/stop [server]` - Stop server
- `/restart [server]` - Restart server
- `/players [server]` - View online players
- `/ram [server] [amount]` - Get/set RAM
- `/console <command> [server]` - Execute command

## API Endpoints

### Account
- `GET /api/account` - Get account information

### Servers
- `GET /api/servers` - List all servers
- `GET /api/servers/:id` - Get server details
- `POST /api/servers/:id/start` - Start server
- `POST /api/servers/:id/stop` - Stop server
- `POST /api/servers/:id/restart` - Restart server

### Commands
- `POST /api/servers/:id/command` - Execute command
  - Body: `{ "command": "say Hello" }`

### Logs
- `GET /api/servers/:id/logs` - Get server logs
- `POST /api/servers/:id/logs/share` - Share logs via mclo.gs

### Resources
- `GET /api/servers/:id/ram` - Get RAM allocation
- `PUT /api/servers/:id/ram` - Set RAM allocation
  - Body: `{ "ram": 4 }` (2-16 GB)
- `GET /api/servers/:id/motd` - Get server MOTD
- `PUT /api/servers/:id/motd` - Set server MOTD
  - Body: `{ "motd": "My Server" }`

### Player Lists
- `GET /api/servers/:id/players` - Get all player lists
- `GET /api/servers/:id/players/:list` - Get player list entries
  - List types: `whitelist`, `ops`, `ban`
- `POST /api/servers/:id/players/:list` - Add player to list
  - Body: `{ "player": "PlayerName" }`
- `DELETE /api/servers/:id/players/:list/:player` - Remove player from list

### Health
- `GET /api/health` - Health check endpoint

## WebSocket Events

Connect to WebSocket at the same URL as the HTTP server (e.g., `ws://localhost:3000`).

### Client → Server
```json
{
  "type": "subscribe",
  "serverId": "your_server_id"
}
```

```json
{
  "type": "unsubscribe",
  "serverId": "your_server_id"
}
```

### Server → Client

**Status updates:**
```json
{
  "type": "status",
  "serverId": "...",
  "data": { "status": 1 }
}
```

**Console output:**
```json
{
  "type": "console",
  "serverId": "...",
  "data": { "line": "Server started" }
}
```

**Tick data (TPS):**
```json
{
  "type": "tick",
  "serverId": "...",
  "data": { "tps": 20.0 }
}
```

**Heap usage:**
```json
{
  "type": "heap",
  "serverId": "...",
  "data": { "usage": 1024, "max": 4096 }
}
```

## Project Structure

```
.
├── src/
│   ├── api/
│   │   └── exaroton.js       # API wrapper class
│   ├── routes/
│   │   └── api.js            # Express routes
│   └── server.js             # Main server file
├── public/
│   ├── index.html            # Dashboard UI
│   ├── style.css             # Styling
│   └── app.js                # Client-side JavaScript
├── .env                      # Environment variables (create this)
├── .env.example              # Environment template
├── package.json              # Project dependencies
└── README.md                 # This file
```

## Server Status Codes

- `0` - Offline
- `1` - Online
- `2` - Starting
- `3` - Stopping
- `4` - Restarting
- `5` - Saving
- `6` - Loading
- `7` - Crashed
- `8` - Pending
- `10` - Preparing

## Error Handling

All API endpoints return responses in the format:
```json
{
  "success": true,
  "data": { ... }
}
```

Or for errors:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security Notes

- **Never commit your `.env` file** to version control
- Keep your API token secure and private
- Use environment variables for sensitive configuration
- Consider adding authentication for production deployments
- Use HTTPS in production environments

## Troubleshooting

### Server won't start
- Verify your API token is correct in `.env`
- Check that the port (default 3000) is not in use
- Ensure Node.js version is 16.x or higher

### WebSocket not connecting
- Check browser console for errors
- Verify the server is running
- Ensure no firewall is blocking WebSocket connections

### API requests failing
- Verify your Exaroton API token has necessary permissions
- Check server logs for detailed error messages
- Ensure the server ID is correct

## Development

### Running in development mode
```bash
npm run dev
```

This uses Node's `--watch` flag to automatically restart on file changes.

### Testing API endpoints
You can use curl, Postman, or any HTTP client:
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/account
curl http://localhost:3000/api/servers
```

## Dependencies

- **exaroton** (^2.0.0) - Official Exaroton API client
- **express** (^4.18.2) - Web framework
- **ws** (^8.14.2) - WebSocket library
- **dotenv** (^16.3.1) - Environment variable management
- **cors** (^2.8.5) - Cross-origin resource sharing

## License

This project is provided as-is for personal use.

## Resources

- [Exaroton API Documentation](https://support.exaroton.com/hc/en-us/articles/360019857918-API)
- [Exaroton NPM Package](https://www.npmjs.com/package/exaroton)
- [Express Documentation](https://expressjs.com/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## Support

For issues with the Exaroton API, visit:
- https://support.exaroton.com/

For issues with this dashboard:
- Check the server logs
- Verify all environment variables are set correctly
- Ensure all dependencies are installed

---

Built with ❤️ for Minecraft server management

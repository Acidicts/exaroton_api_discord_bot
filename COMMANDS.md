# Discord Bot Commands

This document lists all available Discord slash commands and their required permissions.

## Permission Roles

- **Approved**: Users with this role can start the server and create tempban polls
- **Bot**: Users with this role can control and manage the server

## Commands by Permission Level

### Approved Role Required

These commands require the **Approved** Discord role:

| Command | Description |
|---------|-------------|
| `/start` | Start the Minecraft server |
| `/tempbanvote <player> [reason]` | Create a 5-minute poll to temporarily ban a player for 30 minutes |

### Bot Role Required

These commands require the **Bot** Discord role:

| Command | Description |
|---------|-------------|
| `/servers` | List all available Exaroton servers |
| `/status` | Get current server status and information |
| `/stop` | Stop the Minecraft server |
| `/restart` | Restart the Minecraft server |
| `/players` | List online players |
| `/ram [amount]` | Get current RAM or set RAM (2-16 GB) |
| `/console <command>` | Execute a console command on the server |

## Command Details

### `/start`
- **Permission**: Approved role
- **Description**: Starts the Minecraft server
- **Usage**: `/start`
- **Notes**: Server must be offline to use this command

### `/stop`
- **Permission**: Bot role
- **Description**: Stops the Minecraft server
- **Usage**: `/stop`
- **Notes**: Server must be online to use this command

### `/restart`
- **Permission**: Bot role
- **Description**: Restarts the Minecraft server
- **Usage**: `/restart`
- **Notes**: Server must be online to use this command

### `/status`
- **Permission**: Bot role
- **Description**: Shows server status, address, players, RAM, software, and MOTD
- **Usage**: `/status`

### `/servers`
- **Permission**: Bot role
- **Description**: Lists all Exaroton servers with their status
- **Usage**: `/servers`

### `/players`
- **Permission**: Bot role
- **Description**: Shows currently online players
- **Usage**: `/players`

### `/ram`
- **Permission**: Bot role
- **Description**: View current RAM allocation or set new RAM amount
- **Usage**: 
  - Get current RAM: `/ram`
  - Set RAM: `/ram amount:8`
- **Parameters**:
  - `amount` (optional): RAM in GB (2-16)

### `/console`
- **Permission**: Bot role
- **Description**: Execute a console command on the server
- **Usage**: `/console command:say Hello World`
- **Parameters**:
  - `command` (required): The command to execute
- **Notes**: 
  - Server must be online
  - Do NOT include the `/` prefix (e.g., use `say Hello` not `/say Hello`)

### `/tempbanvote`
- **Permission**: Approved role
- **Description**: Creates a 5-minute voting poll to temporarily ban a player for 30 minutes
- **Usage**: `/tempbanvote player:PlayerName reason:Griefing`
- **Parameters**:
  - `player` (required): Minecraft username to ban
  - `reason` (optional): Reason for the ban
- **Poll Details**:
  - Duration: 5 minutes
  - Ban length: 30 minutes (if poll passes)
  - Vote options: Yes / No / End Poll (Bot role only)
  - Result: Ban command executes if Yes votes > No votes
- **Notes**: 
  - Requires EssentialsX plugin on server
  - Bot role can end polls early with "End Poll" button

## Special Features

### Tempban Voting System
- **Initiate**: Users with Approved role can create tempban votes
- **Vote**: All server members can vote Yes or No
- **End Early**: Users with Bot role can end the poll immediately
- **Execution**: If poll passes, executes `/tempban <player> 30m <reason>` on the server
- **Requirement**: Server must have EssentialsX, LiteBans, or AdvancedBan plugin

## Configuration

Role names can be configured in the `.env` file:

```env
# Role required for most commands
DISCORD_REQUIRED_ROLE=Bot

# Role required for /start and /tempbanvote
DISCORD_START_ROLE=Approved

# Tempban command format (customize for your server)
TEMPBAN_COMMAND_FORMAT=tempban {player} 30m {reason}
```

## Notes

- All commands are slash commands (start typing `/` in Discord)
- Commands will only appear for users with the required roles
- The bot controls a single server configured via `DEFAULT_SERVER_ID` in `.env`
- Server must be online for most commands to work

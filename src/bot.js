import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
import ExarotonAPI from './api/exaroton.js';

dotenv.config();

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize Exaroton API
const exarotonAPI = new ExarotonAPI(process.env.EXAROTON_API_TOKEN);

// Polls storage: pollId -> { target, serverId, reason, yes:Set, no:Set, voters:Set, timeout }
const polls = new Map();

// Server status mapping
const statusMap = {
    0: '⚫ Offline',
    1: '🟢 Online',
    2: '🟡 Starting',
    3: '🟠 Stopping',
    4: '🔄 Restarting',
    5: '💾 Saving',
    6: '📦 Loading',
    7: '🔴 Crashed',
    8: '⏳ Pending',
    10: '⚙️ Preparing'
};

// Slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('servers')
        .setDescription('List all available servers'),
    
    new SlashCommandBuilder()
        .setName('status')
        .setDescription('Get server status'),
    
    new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start the server'),
    
    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the server'),
    
    new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Restart the server'),
    
    new SlashCommandBuilder()
        .setName('players')
        .setDescription('Get online players'),
    
    new SlashCommandBuilder()
        .setName('ram')
        .setDescription('Get or set server RAM')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('RAM amount in GB (2-16)')
                .setRequired(false)
                .setMinValue(2)
                .setMaxValue(16)),
    
    new SlashCommandBuilder()
        .setName('console')
        .setDescription('Execute a console command')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Command to execute')
                .setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('tempbanvote')
        .setDescription('Create a 5-minute poll to temp-ban a player for 30 minutes')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('Minecraft username to temp-ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)),
].map(command => command.toJSON());

// Register slash commands
async function registerCommands() {
    try {
        console.log('Registering slash commands...');
        
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
        
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands }
        );
        
        console.log('✓ Slash commands registered successfully');
    } catch (error) {
        console.error('Failed to register slash commands:', error);
    }
}

// Get the configured server ID (always uses DEFAULT_SERVER_ID)
function getServerId() {
    return process.env.DEFAULT_SERVER_ID;
}

// Check if user has required role
function hasRequiredRole(interaction) {
    const requiredRole = process.env.DISCORD_REQUIRED_ROLE;
    if (!requiredRole) return true; // No role requirement set
    
    const member = interaction.member;
    if (!member) return false;
    
    return member.roles.cache.some(role => role.name === requiredRole);
}

function hasRoleByName(interaction, roleName) {
    if (!roleName) return false;
    const member = interaction.member;
    if (!member) return false;
    return member.roles.cache.some(role => role.name === roleName);
}

// Handle interactions
client.on('interactionCreate', async interaction => {
    // Handle button votes
    if (interaction.isButton()) {
        const [action, pollId] = interaction.customId.split(':');
        if (!pollId || !polls.has(pollId)) {
            await interaction.reply({ content: '❌ Poll not found or expired.', ephemeral: true });
            return;
        }

        const poll = polls.get(pollId);

        // Handle End Poll button
        if (action === 'tempban_end') {
            // Check if user has Bot role
            if (!hasRequiredRole(interaction)) {
                await interaction.reply({ content: `❌ You need the **${process.env.DISCORD_REQUIRED_ROLE}** role to end polls.`, ephemeral: true });
                return;
            }
            await interaction.deferUpdate();
            await endPoll(pollId);
            return;
        }

        const voter = interaction.user.id;

        // Prevent multiple votes - allow changing vote
        // Remove from both sets first
        poll.yes.delete(voter);
        poll.no.delete(voter);

        if (action === 'tempban_yes') poll.yes.add(voter);
        if (action === 'tempban_no') poll.no.add(voter);

        // Update message with current counts
        const msg = interaction.message;
        const updatedEmbed = EmbedBuilder.from(msg.embeds[0] || new EmbedBuilder())
            .setFooter({ text: `Poll: ${pollId} | Initiated by ${poll.initiator}` })
            .setTimestamp();

        updatedEmbed.data.fields = [
            { name: 'Yes', value: `${poll.yes.size}`, inline: true },
            { name: 'No', value: `${poll.no.size}`, inline: true },
            { name: 'Target', value: `${poll.target}`, inline: true },
        ];

        // Keep buttons enabled until poll ends
        await interaction.update({ embeds: [updatedEmbed], components: msg.components });
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        // Defer reply immediately to prevent timeout
        await interaction.deferReply();

        // Role checks: /start and /tempbanvote require DISCORD_START_ROLE (default 'Approved'), others require DISCORD_REQUIRED_ROLE
        if (commandName === 'start' || commandName === 'tempbanvote') {
            const startRole = process.env.DISCORD_START_ROLE || 'Approved';
            if (!hasRoleByName(interaction, startRole)) {
                await interaction.editReply({ content: `❌ You need the **${startRole}** role to run /${commandName}.` });
                return;
            }
        } else {
            if (!hasRequiredRole(interaction)) {
                await interaction.editReply({ content: `❌ You need the **${process.env.DISCORD_REQUIRED_ROLE}** role to use this command.` });
                return;
            }
        }

        switch (commandName) {
            case 'servers':
                await handleServers(interaction);
                break;
            case 'status':
                await handleStatus(interaction);
                break;
            case 'start':
                await handleStart(interaction);
                break;
            case 'stop':
                await handleStop(interaction);
                break;
            case 'restart':
                await handleRestart(interaction);
                break;
            case 'players':
                await handlePlayers(interaction);
                break;
            case 'ram':
                await handleRAM(interaction);
                break;
            case 'console':
                await handleConsole(interaction);
                break;
            case 'tempbanvote':
                await handleTempBanVote(interaction);
                break;
            default:
                await interaction.editReply('Unknown command');
        }
    } catch (error) {
        console.error(`Error handling ${commandName}:`, error);
        
        // Try to respond if we haven't already
        try {
            if (interaction.deferred) {
                await interaction.editReply({ content: `❌ Error: ${error.message}` });
            } else {
                await interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
            }
        } catch (replyError) {
            console.error('Failed to send error message:', replyError);
        }
    }
});

// Command handlers
async function handleServers(interaction) {
    const servers = await exarotonAPI.listServers();
    
    const embed = new EmbedBuilder()
        .setColor(0x4a90e2)
        .setTitle('📋 Available Servers')
        .setDescription(servers.map(s => `**${s.name}**\nID: \`${s.id}\`\nStatus: ${statusMap[s.status] || 'Unknown'}`).join('\n\n'))
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
}

async function handleStatus(interaction) {
    const serverId = getServerId();
    
    if (!serverId) {
        await interaction.editReply('❌ DEFAULT_SERVER_ID not configured');
        return;
    }
    
    const server = await exarotonAPI.getServerInfo(serverId);
    
    const embed = new EmbedBuilder()
        .setColor(server.status === 1 ? 0x5cb85c : 0x6c757d)
        .setTitle(`🎮 ${server.name}`)
        .addFields(
            { name: 'Status', value: statusMap[server.status] || 'Unknown', inline: true },
            { name: 'Address', value: server.address || 'N/A', inline: true },
            { name: 'Players', value: server.players ? `${server.players.count}/${server.players.max}` : 'N/A', inline: true },
            { name: 'RAM', value: server.ram ? `${server.ram} GB` : 'N/A', inline: true },
            { name: 'Software', value: server.software ? `${server.software.name} ${server.software.version}` : 'N/A', inline: true },
            { name: 'MOTD', value: server.motd || 'N/A', inline: true }
        )
        .setFooter({ text: `Server ID: ${server.id} | Requested by ${interaction.user.tag}` })
        .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
}

async function handleStart(interaction) {
    const serverId = getServerId();
    
    if (!serverId) {
        await interaction.editReply('❌ DEFAULT_SERVER_ID not configured');
        return;
    }
    
    const result = await exarotonAPI.startServer(serverId);
    
    if (result.success) {
        const embed = new EmbedBuilder()
            .setColor(0x5cb85c)
            .setTitle('▶️ Server Starting')
            .setDescription(`Server is now starting...`)
            .setFooter({ text: `Server ID: ${serverId} | Started by ${interaction.user.tag}` })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    } else {
        await interaction.editReply(`❌ Failed to start server: ${result.error}`);
    }
}

async function handleStop(interaction) {
    const serverId = getServerId();
    
    if (!serverId) {
        await interaction.editReply('❌ DEFAULT_SERVER_ID not configured');
        return;
    }
    
    const result = await exarotonAPI.stopServer(serverId);
    
    if (result.success) {
        const embed = new EmbedBuilder()
            .setColor(0xd9534f)
            .setTitle('⏹️ Server Stopping')
            .setDescription(`Server is now stopping...`)
            .setFooter({ text: `Server ID: ${serverId} | Stopped by ${interaction.user.tag}` })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    } else {
        await interaction.editReply(`❌ Failed to stop server: ${result.error}`);
    }
}

async function handleRestart(interaction) {
    const serverId = getServerId();
    
    if (!serverId) {
        await interaction.editReply('❌ DEFAULT_SERVER_ID not configured');
        return;
    }
    
    const result = await exarotonAPI.restartServer(serverId);
    
    if (result.success) {
        const embed = new EmbedBuilder()
            .setColor(0xf0ad4e)
            .setTitle('🔄 Server Restarting')
            .setDescription(`Server is now restarting...`)
            .setFooter({ text: `Server ID: ${serverId} | Restarted by ${interaction.user.tag}` })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    } else {
        await interaction.editReply(`❌ Failed to restart server: ${result.error}`);
    }
}

async function handlePlayers(interaction) {
    const serverId = getServerId();
    
    if (!serverId) {
        await interaction.editReply('❌ DEFAULT_SERVER_ID not configured');
        return;
    }
    
    const server = await exarotonAPI.getServerInfo(serverId);
    
    const embed = new EmbedBuilder()
        .setColor(0x4a90e2)
        .setTitle(`👥 Players - ${server.name}`)
        .setDescription(
            server.players && server.players.list && server.players.list.length > 0
                ? server.players.list.join('\n')
                : 'No players online'
        )
        .addFields(
            { name: 'Online', value: `${server.players?.count || 0}/${server.players?.max || 0}`, inline: true }
        )
        .setFooter({ text: `Server ID: ${serverId} | Requested by ${interaction.user.tag}` })
        .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
}

async function handleRAM(interaction) {
    const serverId = getServerId();
    const amount = interaction.options.getInteger('amount');
    
    if (!serverId) {
        await interaction.editReply('❌ DEFAULT_SERVER_ID not configured');
        return;
    }
    
    if (amount) {
        // Set RAM
        const result = await exarotonAPI.setRAM(serverId, amount);
        
        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor(0x5cb85c)
                .setTitle('💾 RAM Updated')
                .setDescription(`Server RAM set to ${amount} GB`)
                .setFooter({ text: `Server ID: ${serverId} | Updated by ${interaction.user.tag}` })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply(`❌ Failed to set RAM: ${result.error}`);
        }
    } else {
        // Get RAM
        const ram = await exarotonAPI.getRAM(serverId);
        
        const embed = new EmbedBuilder()
            .setColor(0x4a90e2)
            .setTitle('💾 Server RAM')
            .setDescription(`Current RAM: **${ram} GB**`)
            .setFooter({ text: `Server ID: ${serverId} | Requested by ${interaction.user.tag}` })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
}

async function handleConsole(interaction) {
    const serverId = getServerId();
    const command = interaction.options.getString('command');
    
    if (!serverId) {
        await interaction.editReply('❌ DEFAULT_SERVER_ID not configured');
        return;
    }
    
    // Check if server is online before executing command
    try {
        const serverInfo = await exarotonAPI.getServerInfo(serverId);
        
        if (serverInfo.status !== 1) {
            await interaction.editReply(`❌ Server must be online to execute commands. Current status: ${statusMap[serverInfo.status] || 'Unknown'}`);
            return;
        }
        
        const result = await exarotonAPI.executeCommand(serverId, command);
        
        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor(0x5cb85c)
                .setTitle('🖥️ Command Executed')
                .setDescription(`\`\`\`${command}\`\`\``)
                .setFooter({ text: `Server ID: ${serverId} | Executed by ${interaction.user.tag}` })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply(`❌ Failed to execute command: ${result.error}`);
        }
    } catch (error) {
        await interaction.editReply(`❌ Error: ${error.message}`);
    }
}

// Handle tempbanvote command: create a 5-minute poll, ban for 30 minutes if passes
async function handleTempBanVote(interaction) {
    const player = interaction.options.getString('player');
    const serverId = getServerId();
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!player) {
        await interaction.editReply('❌ Player username is required');
        return;
    }

    if (!serverId) {
        await interaction.editReply('❌ DEFAULT_SERVER_ID not configured');
        return;
    }

    const pollId = `poll_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;

    const embed = new EmbedBuilder()
        .setTitle(`🗳️ Temp-Ban Vote: ${player}`)
        .setDescription(`A vote has been started to temporarily ban **${player}** for 30 minutes.\n\n**Server:** ${serverId}\n**Reason:** ${reason}\n\nVote now — poll ends in 5 minutes.`)
        .addFields(
            { name: 'Yes', value: '0', inline: true },
            { name: 'No', value: '0', inline: true },
            { name: 'Target', value: player, inline: true }
        )
        .setFooter({ text: `Poll: ${pollId} | Initiated by ${interaction.user.tag}` })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`tempban_yes:${pollId}`).setLabel('✅ Yes').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`tempban_no:${pollId}`).setLabel('❌ No').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`tempban_end:${pollId}`).setLabel('⏹️ End Poll').setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });

    const msg = await interaction.fetchReply();

    // store poll
    const timeout = setTimeout(() => endPoll(pollId), 5 * 60 * 1000);
    polls.set(pollId, {
        target: player,
        serverId,
        reason,
        yes: new Set(),
        no: new Set(),
        initiator: interaction.user.tag,
        timeout,
        messageId: msg.id,
        channelId: msg.channelId
    });
}

// End a poll: disable buttons, post result, perform temporary ban/unban if passed
async function endPoll(pollId) {
    const poll = polls.get(pollId);
    if (!poll) return;
    clearTimeout(poll.timeout);

    try {
        const channel = await client.channels.fetch(poll.channelId);
        const message = await channel.messages.fetch(poll.messageId);

        // build disabled buttons showing counts
        const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`tempban_yes:${pollId}`).setLabel(`✅ Yes (${poll.yes.size})`).setStyle(ButtonStyle.Success).setDisabled(true),
            new ButtonBuilder().setCustomId(`tempban_no:${pollId}`).setLabel(`❌ No (${poll.no.size})`).setStyle(ButtonStyle.Danger).setDisabled(true),
            new ButtonBuilder().setCustomId(`tempban_end:${pollId}`).setLabel('⏹️ Ended').setStyle(ButtonStyle.Secondary).setDisabled(true)
        );

        const resultEmbed = EmbedBuilder.from(message.embeds[0] || new EmbedBuilder())
            .setFooter({ text: `Poll ended | Initiated by ${poll.initiator}` })
            .setTimestamp();

        resultEmbed.data.fields = [
            { name: 'Yes', value: `${poll.yes.size}`, inline: true },
            { name: 'No', value: `${poll.no.size}`, inline: true },
            { name: 'Target', value: `${poll.target}`, inline: true }
        ];

        await message.edit({ embeds: [resultEmbed], components: [disabledRow] });

        // Decide outcome
        if (poll.yes.size > poll.no.size) {
            // Execute tempban command on server
            try {
                // Check if server is online before executing command
                const serverInfo = await exarotonAPI.getServerInfo(poll.serverId);
                
                if (serverInfo.status !== 1) { // Status 1 = online
                    await channel.send(`⚠️ Poll passed but server is offline. Cannot execute tempban command. Please ban **${poll.target}** manually when server starts. (Initiated by ${poll.initiator})`);
                } else {
                    // Try different tempban command formats based on TEMPBAN_COMMAND_FORMAT env var
                    // Default: "tempban {player} 30m {reason}"
                    // Alternatives: "ban {player} 30m {reason}" or "minecraft:ban {player}" etc.
                    const commandFormat = process.env.TEMPBAN_COMMAND_FORMAT || 'tempban {player} 30m {reason}';
                    const banCommand = commandFormat
                        .replace('{player}', poll.target)
                        .replace('{reason}', poll.reason);
                    
                    console.log('Executing tempban command:', banCommand);
                    
                    try {
                        const res = await exarotonAPI.executeCommand(poll.serverId, banCommand);
                        console.log('Tempban command result:', res);
                        
                        if (res.success) {
                            await channel.send(`✅ Poll passed. Executed: \`${banCommand}\` (Initiated by ${poll.initiator})`);
                        } else {
                            await channel.send(`❌ Poll passed but command failed: ${res.error} (Initiated by ${poll.initiator})`);
                        }
                    } catch (cmdErr) {
                        // Command execution failed - provide helpful message
                        console.error('Command execution error:', cmdErr);
                        await channel.send(`❌ Poll passed but command \`${banCommand}\` failed: ${cmdErr.message}\n\n**Note:** Your server might not have a tempban plugin installed, or the command format is different. Configure TEMPBAN_COMMAND_FORMAT in .env or manually ban **${poll.target}** for 30 minutes. (Initiated by ${poll.initiator})`);
                    }
                }
            } catch (err) {
                console.error('Failed to execute tempban command:', err);
                await channel.send(`❌ Poll passed but failed to execute tempban: ${err.message} (Initiated by ${poll.initiator})`);
            }
        } else {
            await channel.send(`⛔ Poll failed. **${poll.target}** will not be temp-banned. (Initiated by ${poll.initiator})`);
        }
    } catch (err) {
        console.error('Error ending poll:', err);
    } finally {
        polls.delete(pollId);
    }
}

// Bot ready
client.once('ready', () => {
    console.log(`✓ Discord bot logged in as ${client.user.tag}`);
    console.log(`✓ Bot is ready in ${client.guilds.cache.size} server(s)`);
    
    client.user.setActivity('Exaroton Servers', { type: 3 }); // Watching
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Start bot
async function start() {
    // Validate environment variables
    if (!process.env.DISCORD_BOT_TOKEN) {
        console.error('❌ DISCORD_BOT_TOKEN is not set in .env file');
        process.exit(1);
    }
    
    if (!process.env.DISCORD_CLIENT_ID) {
        console.error('❌ DISCORD_CLIENT_ID is not set in .env file');
        process.exit(1);
    }
    
    if (!process.env.EXAROTON_API_TOKEN) {
        console.error('❌ EXAROTON_API_TOKEN is not set in .env file');
        process.exit(1);
    }
    
    // Register commands
    await registerCommands();
    
    // Login to Discord
    await client.login(process.env.DISCORD_BOT_TOKEN);
}

start();

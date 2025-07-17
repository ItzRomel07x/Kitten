const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const voiceService = require('./services/voice');

// Create Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize commands collection
client.commands = new Collection();

// Load command files
const commandsPath = path.join(__dirname, 'bot/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// Load event handlers
const eventsPath = path.join(__dirname, 'bot/events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        logger.error('Error executing command:', error);
        
        const errorMessage = {
            content: 'There was an error while executing this command!',
            ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    
    // Disconnect from all voice channels
    client.guilds.cache.forEach(guild => {
        const connection = getVoiceConnection(guild.id);
        if (connection) {
            connection.destroy();
        }
    });
    
    await client.destroy();
    process.exit(0);
});

// Error handling
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
});

// Start the bot
const token = process.env.DISCORD_TOKEN;
if (!token) {
    logger.error('No Discord token provided! Please set the DISCORD_TOKEN environment variable.');
    process.exit(1);
}

client.login(token);

module.exports = client;

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load all commands
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    commands.push(command.data.toJSON());
}

// Deploy commands to Discord
async function deployCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        logger.info(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands }
        );

        logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        logger.error('Error deploying commands:', error);
    }
}

// Auto-deploy commands if this file is run directly
if (require.main === module) {
    deployCommands();
}

module.exports = { deployCommands };

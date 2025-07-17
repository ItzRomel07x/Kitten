const logger = require('../../utils/logger');
const configService = require('../../services/config');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        logger.info(`Bot logged in as ${client.user.tag}`);
        logger.info(`Connected to ${client.guilds.cache.size} servers`);
        
        // Set bot presence
        client.user.setActivity('voice channels | /help', { type: 'WATCHING' });
        
        // Initialize configuration service
        configService.initialize();
        
        // Log some basic statistics
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        logger.info(`Serving ${totalUsers} users across ${client.guilds.cache.size} servers`);
        
        // Auto-rejoin voice channels if configured (optional feature)
        await autoRejoinChannels(client);
    }
};

async function autoRejoinChannels(client) {
    try {
        const serverConfigs = configService.getAllServerConfigs();
        
        for (const [guildId, config] of Object.entries(serverConfigs)) {
            if (config.autoReconnect && config.lastChannelId) {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) continue;
                
                const channel = guild.channels.cache.get(config.lastChannelId);
                if (!channel || channel.type !== 2) continue; // ChannelType.GuildVoice
                
                try {
                    const voiceService = require('../../services/voice');
                    await voiceService.joinChannel(channel);
                    logger.info(`Auto-rejoined voice channel: ${channel.name} in guild: ${guild.name}`);
                } catch (error) {
                    logger.error(`Failed to auto-rejoin ${channel.name} in ${guild.name}:`, error);
                }
            }
        }
    } catch (error) {
        logger.error('Error during auto-rejoin process:', error);
    }
}

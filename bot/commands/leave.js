const { SlashCommandBuilder } = require('discord.js');
const voiceService = require('../../services/voice');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Leave the current voice channel'),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        
        if (!voiceService.isConnected(guildId)) {
            return interaction.reply({
                content: 'I\'m not currently in a voice channel!',
                ephemeral: true
            });
        }

        try {
            const channelName = voiceService.getCurrentChannel(guildId)?.name || 'Unknown';
            
            voiceService.leaveChannel(guildId);
            
            logger.info(`Left voice channel: ${channelName} in guild: ${interaction.guild.name}`);
            
            await interaction.reply({
                content: `Successfully left **${channelName}**!`,
                ephemeral: false
            });
        } catch (error) {
            logger.error('Error leaving voice channel:', error);
            
            await interaction.reply({
                content: 'Failed to leave the voice channel. Please try again.',
                ephemeral: true
            });
        }
    }
};

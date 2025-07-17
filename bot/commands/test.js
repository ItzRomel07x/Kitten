const { SlashCommandBuilder } = require('discord.js');
const voiceService = require('../../services/voice');
const ttsService = require('../../services/tts');
const configService = require('../../services/config');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Test your join/leave announcement phrases'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        if (!voiceService.isConnected(guildId)) {
            return interaction.reply({
                content: 'I\'m not currently in a voice channel! Use `/join` first.',
                ephemeral: true
            });
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            // Get user phrases and settings
            const userPhrases = configService.getUserPhrases(guildId, userId);
            const defaultPhrases = configService.getDefaultPhrases();
            const userSettings = configService.getUserVoiceSettings(guildId, userId);

            const joinPhrase = userPhrases.join || defaultPhrases.join;
            const leavePhrase = userPhrases.leave || defaultPhrases.leave;

            // Replace {user} placeholder with actual username
            const username = interaction.user.displayName || interaction.user.username;
            const joinMessage = joinPhrase.replace('{user}', username);
            const leaveMessage = leavePhrase.replace('{user}', username);

            // Test join phrase
            logger.info(`Testing join phrase for ${interaction.user.tag}: "${joinMessage}"`);
            
            const joinAudio = await ttsService.generateSpeech(
                joinMessage, 
                userSettings.voice, 
                userSettings.speed
            );
            
            await voiceService.playAudio(guildId, joinAudio);

            // Wait a bit between messages
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Test leave phrase
            logger.info(`Testing leave phrase for ${interaction.user.tag}: "${leaveMessage}"`);
            
            const leaveAudio = await ttsService.generateSpeech(
                leaveMessage, 
                userSettings.voice, 
                userSettings.speed
            );
            
            await voiceService.playAudio(guildId, leaveAudio);

            await interaction.editReply({
                content: `✅ **Test completed!**\n\n` +
                        `**Join phrase:** "${joinMessage}"\n` +
                        `**Leave phrase:** "${leaveMessage}"\n\n` +
                        `*Voice: ${userSettings.voice} at ${userSettings.speed}% speed*`
            });

            logger.info(`User ${interaction.user.tag} tested phrases in ${interaction.guild.name}`);
        } catch (error) {
            logger.error('Error testing phrases:', error);
            
            await interaction.editReply({
                content: 'Failed to test phrases. Please check that I have proper permissions and try again.'
            });
        }
    }
};

const { SlashCommandBuilder } = require('discord.js');
const voiceService = require('../../services/voice');
const ttsService = require('../../services/tts');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot say something in the voice channel')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to speak')
                .setRequired(true)
                .setMaxLength(500)
        )
        .addStringOption(option =>
            option.setName('voice')
                .setDescription('Voice to use for speech')
                .setRequired(false)
        ),

    async execute(interaction) {
        const text = interaction.options.getString('text');
        const voice = interaction.options.getString('voice') || 'Joanna';
        const guildId = interaction.guild.id;

        if (!voiceService.isConnected(guildId)) {
            return interaction.reply({
                content: 'I\'m not currently in a voice channel! Use `/join` first.',
                ephemeral: true
            });
        }

        // Validate text content
        if (text.length > 500) {
            return interaction.reply({
                content: 'Text is too long! Maximum 500 characters allowed.',
                ephemeral: true
            });
        }

        // Filter out potential harmful content
        const cleanText = text.replace(/[<>@#&!]/g, '');
        
        if (cleanText.trim().length === 0) {
            return interaction.reply({
                content: 'Please provide valid text to speak!',
                ephemeral: true
            });
        }

        try {
            await interaction.deferReply();

            // Generate TTS audio
            const audioBuffer = await ttsService.generateSpeech(cleanText, voice);
            
            // Play audio in voice channel
            await voiceService.playAudio(guildId, audioBuffer);
            
            logger.info(`TTS played in ${interaction.guild.name}: "${cleanText}" with voice: ${voice}`);
            
            await interaction.editReply({
                content: `🔊 Speaking: "${cleanText}"`,
            });
        } catch (error) {
            logger.error('Error with TTS command:', error);
            
            const errorMessage = error.message.includes('Invalid voice') 
                ? 'Invalid voice selected. Use `/voice` to see available voices.'
                : 'Failed to generate or play speech. Please try again.';
            
            await interaction.editReply({
                content: errorMessage
            });
        }
    }
};

const { SlashCommandBuilder } = require('discord.js');
const configService = require('../../services/config');
const voicesConfig = require('../../config/voices.json');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voice')
        .setDescription('Configure TTS voice settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set your TTS voice')
                .addStringOption(option =>
                    option.setName('voice')
                        .setDescription('Voice to use for your announcements')
                        .setRequired(true)
                        .addChoices(
                            ...voicesConfig.voices.slice(0, 25).map(voice => ({
                                name: `${voice.name} (${voice.language})`,
                                value: voice.id
                            }))
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all available voices')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('speed')
                .setDescription('Set speech speed')
                .addIntegerOption(option =>
                    option.setName('speed')
                        .setDescription('Speech speed (50-200)')
                        .setRequired(true)
                        .setMinValue(50)
                        .setMaxValue(200)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('current')
                .setDescription('View your current voice settings')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'set':
                    const selectedVoice = interaction.options.getString('voice');
                    
                    // Validate voice exists
                    const voiceData = voicesConfig.voices.find(v => v.id === selectedVoice);
                    if (!voiceData) {
                        return interaction.reply({
                            content: 'Invalid voice selected!',
                            ephemeral: true
                        });
                    }

                    configService.setUserVoice(guildId, userId, selectedVoice);
                    
                    await interaction.reply({
                        content: `✅ Voice set to **${voiceData.name}** (${voiceData.language})`,
                        ephemeral: true
                    });
                    
                    logger.info(`User ${interaction.user.tag} set voice to ${selectedVoice} in ${interaction.guild.name}`);
                    break;

                case 'list':
                    const voiceList = voicesConfig.voices
                        .map(voice => `• **${voice.name}** (${voice.language}) - ${voice.gender}`)
                        .join('\n');
                    
                    // Split into chunks if too long
                    const chunks = [];
                    const lines = voiceList.split('\n');
                    let currentChunk = '';
                    
                    for (const line of lines) {
                        if ((currentChunk + line).length > 1900) {
                            chunks.push(currentChunk);
                            currentChunk = line + '\n';
                        } else {
                            currentChunk += line + '\n';
                        }
                    }
                    if (currentChunk) chunks.push(currentChunk);

                    await interaction.reply({
                        content: `**Available Voices:**\n${chunks[0]}`,
                        ephemeral: true
                    });
                    
                    // Send additional chunks if needed
                    for (let i = 1; i < chunks.length; i++) {
                        await interaction.followUp({
                            content: chunks[i],
                            ephemeral: true
                        });
                    }
                    break;

                case 'speed':
                    const speed = interaction.options.getInteger('speed');
                    
                    configService.setUserSpeed(guildId, userId, speed);
                    
                    await interaction.reply({
                        content: `✅ Speech speed set to ${speed}%`,
                        ephemeral: true
                    });
                    
                    logger.info(`User ${interaction.user.tag} set speech speed to ${speed}% in ${interaction.guild.name}`);
                    break;

                case 'current':
                    const userSettings = configService.getUserVoiceSettings(guildId, userId);
                    const currentVoice = voicesConfig.voices.find(v => v.id === userSettings.voice) || voicesConfig.voices[0];
                    
                    await interaction.reply({
                        content: `**Your current voice settings:**\n` +
                                `**Voice:** ${currentVoice.name} (${currentVoice.language})\n` +
                                `**Speed:** ${userSettings.speed}%`,
                        ephemeral: true
                    });
                    break;
            }
        } catch (error) {
            logger.error('Error handling voice command:', error);
            
            await interaction.reply({
                content: 'Failed to update voice settings. Please try again.',
                ephemeral: true
            });
        }
    }
};

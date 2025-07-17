const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const voiceService = require('../../services/voice');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join your current voice channel or a specified one')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Specific voice channel to join')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');
        const userVoiceChannel = interaction.member?.voice?.channel; // ❗ Safe optional chaining

        // Determine which channel to join
        const channelToJoin = targetChannel || userVoiceChannel;

        // Handle case where neither is available
        if (!channelToJoin) {
            return interaction.reply({
                content: '❌ You must be in a voice channel or specify one using `/join channel:`',
                ephemeral: true
            });
        }

        // Double-check that it's a voice channel (should be unnecessary if using addChannelTypes)
        if (channelToJoin.type !== ChannelType.GuildVoice) {
            return interaction.reply({
                content: '❌ That channel is not a voice channel!',
                ephemeral: true
            });
        }

        // Check bot permissions
        const botPermissions = channelToJoin.permissionsFor(interaction.client.user);
        if (!botPermissions?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
            return interaction.reply({
                content: '🚫 I don’t have permission to join or speak in that voice channel.',
                ephemeral: true
            });
        }

        try {
            await voiceService.joinChannel(channelToJoin);

            logger.info(`✅ Joined voice channel: ${channelToJoin.name} in ${interaction.guild.name}`);

            await interaction.reply({
                content: `🔊 Successfully joined **${channelToJoin.name}**!`,
                ephemeral: false
            });
        } catch (error) {
            logger.error('Error joining voice channel:', error);

            await interaction.reply({
                content: '⚠️ Failed to join the voice channel. Please try again.',
                ephemeral: true
            });
        }
    }
};

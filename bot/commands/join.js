const { SlashCommandBuilder } = require('discord.js');
const voiceService = require('../../services/voice');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join your current voice channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Specific voice channel to join')
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');
        const userVoiceChannel = interaction.member.voice.channel;

        // Determine which channel to join
        const channelToJoin = targetChannel || userVoiceChannel;

        if (!channelToJoin) {
            return interaction.reply({
                content: 'You must be in a voice channel or specify a channel to join!',
                ephemeral: true
            });
        }

        if (channelToJoin.type !== 2) { // ChannelType.GuildVoice
            return interaction.reply({
                content: 'The specified channel is not a voice channel!',
                ephemeral: true
            });
        }

        // Check permissions
        const permissions = channelToJoin.permissionsFor(interaction.client.user);
        if (!permissions.has(['Connect', 'Speak'])) {
            return interaction.reply({
                content: 'I don\'t have permission to join that voice channel!',
                ephemeral: true
            });
        }

        try {
            await voiceService.joinChannel(channelToJoin);
            
            logger.info(`Joined voice channel: ${channelToJoin.name} in guild: ${interaction.guild.name}`);
            
            await interaction.reply({
                content: `Successfully joined **${channelToJoin.name}**! I will now announce when users join or leave this channel.`,
                ephemeral: false
            });
        } catch (error) {
            logger.error('Error joining voice channel:', error);
            
            await interaction.reply({
                content: 'Failed to join the voice channel. Please try again.',
                ephemeral: true
            });
        }
    }
};

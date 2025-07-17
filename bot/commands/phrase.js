const { SlashCommandBuilder } = require('discord.js');
const configService = require('../../services/config');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('phrase')
        .setDescription('Set custom join/leave phrases')
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Set custom join phrase')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Custom join message (use {user} for username)')
                        .setRequired(true)
                        .setMaxLength(200)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Set custom leave phrase')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Custom leave message (use {user} for username)')
                        .setRequired(true)
                        .setMaxLength(200)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View your current phrases')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset phrases to default')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'join':
                    const joinMessage = interaction.options.getString('message');
                    
                    // Validate message
                    if (joinMessage.length > 200) {
                        return interaction.reply({
                            content: 'Join message is too long! Maximum 200 characters allowed.',
                            ephemeral: true
                        });
                    }

                    configService.setUserPhrase(guildId, userId, 'join', joinMessage);
                    
                    await interaction.reply({
                        content: `✅ Custom join phrase set: "${joinMessage}"`,
                        ephemeral: true
                    });
                    
                    logger.info(`User ${interaction.user.tag} set join phrase in ${interaction.guild.name}`);
                    break;

                case 'leave':
                    const leaveMessage = interaction.options.getString('message');
                    
                    // Validate message
                    if (leaveMessage.length > 200) {
                        return interaction.reply({
                            content: 'Leave message is too long! Maximum 200 characters allowed.',
                            ephemeral: true
                        });
                    }

                    configService.setUserPhrase(guildId, userId, 'leave', leaveMessage);
                    
                    await interaction.reply({
                        content: `✅ Custom leave phrase set: "${leaveMessage}"`,
                        ephemeral: true
                    });
                    
                    logger.info(`User ${interaction.user.tag} set leave phrase in ${interaction.guild.name}`);
                    break;

                case 'view':
                    const userPhrases = configService.getUserPhrases(guildId, userId);
                    const defaultPhrases = configService.getDefaultPhrases();
                    
                    const joinPhrase = userPhrases.join || defaultPhrases.join;
                    const leavePhrase = userPhrases.leave || defaultPhrases.leave;
                    
                    await interaction.reply({
                        content: `**Your current phrases:**\n` +
                                `**Join:** ${joinPhrase}\n` +
                                `**Leave:** ${leavePhrase}\n\n` +
                                `*Use {user} in your phrases to mention the username*`,
                        ephemeral: true
                    });
                    break;

                case 'reset':
                    configService.resetUserPhrases(guildId, userId);
                    
                    await interaction.reply({
                        content: '✅ Your phrases have been reset to default!',
                        ephemeral: true
                    });
                    
                    logger.info(`User ${interaction.user.tag} reset phrases in ${interaction.guild.name}`);
                    break;
            }
        } catch (error) {
            logger.error('Error handling phrase command:', error);
            
            await interaction.reply({
                content: 'Failed to update phrases. Please try again.',
                ephemeral: true
            });
        }
    }
};

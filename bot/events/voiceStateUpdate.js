const voiceService = require('../../services/voice');
const ttsService = require('../../services/tts');
const configService = require('../../services/config');
const logger = require('../../utils/logger');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const member = newState.member;
        const guild = newState.guild;
        
        // Ignore bot events
        if (member.user.bot) return;

        const botConnection = voiceService.getConnection(guild.id);
        if (!botConnection) return;

        const botChannel = voiceService.getCurrentChannel(guild.id);
        if (!botChannel) return;

        try {
            // User joined the bot's channel
            if (!oldState.channel && newState.channel && newState.channel.id === botChannel.id) {
                await handleUserJoin(member, guild.id);
            }
            
            // User left the bot's channel
            if (oldState.channel && oldState.channel.id === botChannel.id && 
                (!newState.channel || newState.channel.id !== botChannel.id)) {
                await handleUserLeave(member, guild.id);
            }
            
            // User switched from bot's channel to another channel
            if (oldState.channel && oldState.channel.id === botChannel.id && 
                newState.channel && newState.channel.id !== botChannel.id) {
                await handleUserLeave(member, guild.id);
            }
            
            // User switched from another channel to bot's channel
            if (oldState.channel && oldState.channel.id !== botChannel.id && 
                newState.channel && newState.channel.id === botChannel.id) {
                await handleUserJoin(member, guild.id);
            }
        } catch (error) {
            logger.error('Error handling voice state update:', error);
        }
    }
};

async function handleUserJoin(member, guildId) {
    try {
        const userPhrases = configService.getUserPhrases(guildId, member.id);
        const defaultPhrases = configService.getDefaultPhrases();
        const userSettings = configService.getUserVoiceSettings(guildId, member.id);

        const joinPhrase = userPhrases.join || defaultPhrases.join;
        const username = member.displayName || member.user.username;
        const message = joinPhrase.replace('{user}', username);

        logger.info(`User joined: ${member.user.tag} in guild: ${member.guild.name}`);
        
        // Generate and play TTS
        const audioBuffer = await ttsService.generateSpeech(
            message, 
            userSettings.voice, 
            userSettings.speed
        );
        
        await voiceService.playAudio(guildId, audioBuffer);
        
        logger.info(`Join announcement played for ${member.user.tag}: "${message}"`);
    } catch (error) {
        logger.error('Error handling user join:', error);
    }
}

async function handleUserLeave(member, guildId) {
    try {
        const userPhrases = configService.getUserPhrases(guildId, member.id);
        const defaultPhrases = configService.getDefaultPhrases();
        const userSettings = configService.getUserVoiceSettings(guildId, member.id);

        const leavePhrase = userPhrases.leave || defaultPhrases.leave;
        const username = member.displayName || member.user.username;
        const message = leavePhrase.replace('{user}', username);

        logger.info(`User left: ${member.user.tag} in guild: ${member.guild.name}`);
        
        // Generate and play TTS
        const audioBuffer = await ttsService.generateSpeech(
            message, 
            userSettings.voice, 
            userSettings.speed
        );
        
        await voiceService.playAudio(guildId, audioBuffer);
        
        logger.info(`Leave announcement played for ${member.user.tag}: "${message}"`);
    } catch (error) {
        logger.error('Error handling user leave:', error);
    }
}

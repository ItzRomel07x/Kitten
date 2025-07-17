const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ConfigService {
    constructor() {
        this.configPath = path.join(__dirname, '../config/server-configs.json');
        this.data = {};
        this.defaultPhrases = {
            join: '{user} has joined the channel',
            leave: '{user} has left the channel'
        };
        this.defaultVoiceSettings = {
            voice: 'Joanna',
            speed: 100
        };
    }

    /**
     * Initialize the config service
     */
    initialize() {
        try {
            if (fs.existsSync(this.configPath)) {
                const rawData = fs.readFileSync(this.configPath, 'utf8');
                this.data = JSON.parse(rawData);
                logger.info('Configuration loaded successfully');
            } else {
                this.data = {};
                this.save();
                logger.info('Created new configuration file');
            }
        } catch (error) {
            logger.error('Error initializing config:', error);
            this.data = {};
        }
    }

    /**
     * Save configuration to file
     */
    save() {
        try {
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            fs.writeFileSync(this.configPath, JSON.stringify(this.data, null, 2));
            logger.debug('Configuration saved');
        } catch (error) {
            logger.error('Error saving config:', error);
        }
    }

    /**
     * Get server configuration
     * @param {string} guildId - Guild ID
     * @returns {Object}
     */
    getServerConfig(guildId) {
        if (!this.data[guildId]) {
            this.data[guildId] = {
                users: {},
                settings: {
                    autoReconnect: true,
                    lastChannelId: null
                }
            };
        }
        return this.data[guildId];
    }

    /**
     * Get user configuration
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Object}
     */
    getUserConfig(guildId, userId) {
        const serverConfig = this.getServerConfig(guildId);
        if (!serverConfig.users[userId]) {
            serverConfig.users[userId] = {
                phrases: {},
                voice: this.defaultVoiceSettings.voice,
                speed: this.defaultVoiceSettings.speed
            };
        }
        return serverConfig.users[userId];
    }

    /**
     * Set user join/leave phrase
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @param {string} type - 'join' or 'leave'
     * @param {string} phrase - Custom phrase
     */
    setUserPhrase(guildId, userId, type, phrase) {
        const userConfig = this.getUserConfig(guildId, userId);
        userConfig.phrases[type] = phrase;
        this.save();
    }

    /**
     * Get user phrases
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Object}
     */
    getUserPhrases(guildId, userId) {
        const userConfig = this.getUserConfig(guildId, userId);
        return userConfig.phrases;
    }

    /**
     * Reset user phrases to default
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     */
    resetUserPhrases(guildId, userId) {
        const userConfig = this.getUserConfig(guildId, userId);
        userConfig.phrases = {};
        this.save();
    }

    /**
     * Set user voice
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @param {string} voice - Voice ID
     */
    setUserVoice(guildId, userId, voice) {
        const userConfig = this.getUserConfig(guildId, userId);
        userConfig.voice = voice;
        this.save();
    }

    /**
     * Set user speech speed
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @param {number} speed - Speech speed (50-200)
     */
    setUserSpeed(guildId, userId, speed) {
        const userConfig = this.getUserConfig(guildId, userId);
        userConfig.speed = speed;
        this.save();
    }

    /**
     * Get user voice settings
     * @param {string} guildId - Guild ID
     * @param {string} userId - User ID
     * @returns {Object}
     */
    getUserVoiceSettings(guildId, userId) {
        const userConfig = this.getUserConfig(guildId, userId);
        return {
            voice: userConfig.voice || this.defaultVoiceSettings.voice,
            speed: userConfig.speed || this.defaultVoiceSettings.speed
        };
    }

    /**
     * Get default phrases
     * @returns {Object}
     */
    getDefaultPhrases() {
        return this.defaultPhrases;
    }

    /**
     * Set last channel for auto-reconnect
     * @param {string} guildId - Guild ID
     * @param {string} channelId - Channel ID
     */
    setLastChannel(guildId, channelId) {
        const serverConfig = this.getServerConfig(guildId);
        serverConfig.settings.lastChannelId = channelId;
        this.save();
    }

    /**
     * Get all server configurations
     * @returns {Object}
     */
    getAllServerConfigs() {
        return this.data;
    }

    /**
     * Set server auto-reconnect setting
     * @param {string} guildId - Guild ID
     * @param {boolean} autoReconnect - Auto-reconnect enabled
     */
    setAutoReconnect(guildId, autoReconnect) {
        const serverConfig = this.getServerConfig(guildId);
        serverConfig.settings.autoReconnect = autoReconnect;
        this.save();
    }

    /**
     * Get server statistics
     * @returns {Object}
     */
    getStats() {
        const serverCount = Object.keys(this.data).length;
        let userCount = 0;
        let customPhraseCount = 0;

        for (const serverId in this.data) {
            const users = this.data[serverId].users || {};
            userCount += Object.keys(users).length;
            
            for (const userId in users) {
                const phrases = users[userId].phrases || {};
                customPhraseCount += Object.keys(phrases).length;
            }
        }

        return {
            servers: serverCount,
            users: userCount,
            customPhrases: customPhraseCount
        };
    }
}

module.exports = new ConfigService();

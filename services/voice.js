const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection, StreamType } = require('@discordjs/voice');
const { createReadStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const configService = require('./config');

const pipelineAsync = promisify(pipeline);

class VoiceService {
    constructor() {
        this.connections = new Map();
        this.audioPlayers = new Map();
        this.currentChannels = new Map();
        this.audioQueue = new Map();
        this.isPlaying = new Map();
        this.tempDir = path.join(__dirname, '../temp');
        
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Join a voice channel
     * @param {VoiceChannel} channel - Discord voice channel
     * @returns {Promise<VoiceConnection>}
     */
    async joinChannel(channel) {
        try {
            const guildId = channel.guild.id;
            
            // Leave existing connection if any
            if (this.connections.has(guildId)) {
                this.leaveChannel(guildId);
            }

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guildId,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfMute: false,
                selfDeaf: false
            });

            // Set up connection event handlers
            this.setupConnectionHandlers(connection, guildId);

            // Create audio player for this guild
            const player = createAudioPlayer();
            this.setupPlayerHandlers(player, guildId);

            // Subscribe the connection to the player
            connection.subscribe(player);

            // Store references
            this.connections.set(guildId, connection);
            this.audioPlayers.set(guildId, player);
            this.currentChannels.set(guildId, channel);
            this.audioQueue.set(guildId, []);
            this.isPlaying.set(guildId, false);

            // Save to config for auto-reconnect
            configService.setLastChannel(guildId, channel.id);

            logger.info(`Successfully joined voice channel: ${channel.name} in guild: ${channel.guild.name}`);
            return connection;

        } catch (error) {
            logger.error('Error joining voice channel:', error);
            throw error;
        }
    }

    /**
     * Leave voice channel
     * @param {string} guildId - Guild ID
     */
    leaveChannel(guildId) {
        try {
            const connection = this.connections.get(guildId);
            if (connection) {
                connection.destroy();
            }

            // Clean up references
            this.connections.delete(guildId);
            this.audioPlayers.delete(guildId);
            this.currentChannels.delete(guildId);
            this.audioQueue.delete(guildId);
            this.isPlaying.delete(guildId);

            logger.info(`Left voice channel in guild: ${guildId}`);
        } catch (error) {
            logger.error('Error leaving voice channel:', error);
            throw error;
        }
    }

    /**
     * Play audio in voice channel
     * @param {string} guildId - Guild ID
     * @param {Buffer} audioBuffer - Audio data
     * @returns {Promise<void>}
     */
    async playAudio(guildId, audioBuffer) {
        try {
            const player = this.audioPlayers.get(guildId);
            if (!player) {
                throw new Error('No audio player found for this guild');
            }

            // Add to queue
            const queue = this.audioQueue.get(guildId) || [];
            queue.push(audioBuffer);
            this.audioQueue.set(guildId, queue);

            // Process queue if not already playing
            if (!this.isPlaying.get(guildId)) {
                await this.processAudioQueue(guildId);
            }

        } catch (error) {
            logger.error('Error playing audio:', error);
            throw error;
        }
    }

    /**
     * Process audio queue for a guild
     * @param {string} guildId - Guild ID
     */
    async processAudioQueue(guildId) {
        const queue = this.audioQueue.get(guildId) || [];
        const player = this.audioPlayers.get(guildId);

        if (queue.length === 0 || !player) {
            this.isPlaying.set(guildId, false);
            return;
        }

        this.isPlaying.set(guildId, true);

        try {
            const audioBuffer = queue.shift();
            this.audioQueue.set(guildId, queue);

            // Write buffer to temporary file
            const tempFile = path.join(this.tempDir, `audio_${guildId}_${Date.now()}.mp3`);
            await fs.promises.writeFile(tempFile, audioBuffer);

            // Create audio resource with proper format
            const resource = createAudioResource(createReadStream(tempFile), {
                inputType: StreamType.Arbitrary,
                inlineVolume: true
            });
            
            // Set volume
            resource.volume.setVolume(0.8);
            
            // Play the audio
            player.play(resource);
            
            logger.info(`Playing audio file: ${tempFile} (${audioBuffer.length} bytes)`);

            // Clean up temp file after playing
            player.once(AudioPlayerStatus.Idle, async () => {
                try {
                    await fs.promises.unlink(tempFile);
                } catch (error) {
                    logger.error('Error cleaning up temp file:', error);
                }
                
                // Process next item in queue
                setTimeout(() => this.processAudioQueue(guildId), 500);
            });

        } catch (error) {
            logger.error('Error processing audio queue:', error);
            this.isPlaying.set(guildId, false);
        }
    }

    /**
     * Set up connection event handlers
     * @param {VoiceConnection} connection - Voice connection
     * @param {string} guildId - Guild ID
     */
    setupConnectionHandlers(connection, guildId) {
        connection.on(VoiceConnectionStatus.Ready, () => {
            logger.info(`Voice connection ready for guild: ${guildId}`);
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            logger.warn(`Voice connection disconnected for guild: ${guildId}`);
            
            try {
                // Try to reconnect
                await connection.rejoin();
                logger.info(`Successfully reconnected to voice channel in guild: ${guildId}`);
            } catch (error) {
                logger.error(`Failed to reconnect to voice channel in guild: ${guildId}`, error);
                this.leaveChannel(guildId);
            }
        });

        connection.on(VoiceConnectionStatus.Destroyed, () => {
            logger.info(`Voice connection destroyed for guild: ${guildId}`);
            this.leaveChannel(guildId);
        });

        connection.on('error', (error) => {
            logger.error(`Voice connection error for guild: ${guildId}`, error);
        });
    }

    /**
     * Set up audio player event handlers
     * @param {AudioPlayer} player - Audio player
     * @param {string} guildId - Guild ID
     */
    setupPlayerHandlers(player, guildId) {
        player.on(AudioPlayerStatus.Playing, () => {
            logger.info(`Audio player started playing in guild: ${guildId}`);
        });

        player.on(AudioPlayerStatus.Idle, () => {
            logger.info(`Audio player idle in guild: ${guildId}`);
        });

        player.on(AudioPlayerStatus.Buffering, () => {
            logger.info(`Audio player buffering in guild: ${guildId}`);
        });

        player.on(AudioPlayerStatus.AutoPaused, () => {
            logger.warn(`Audio player auto-paused in guild: ${guildId}`);
        });

        player.on('error', (error) => {
            logger.error(`Audio player error in guild: ${guildId}`, error);
        });
    }

    /**
     * Check if bot is connected to voice channel
     * @param {string} guildId - Guild ID
     * @returns {boolean}
     */
    isConnected(guildId) {
        return this.connections.has(guildId);
    }

    /**
     * Get voice connection
     * @param {string} guildId - Guild ID
     * @returns {VoiceConnection|null}
     */
    getConnection(guildId) {
        return this.connections.get(guildId) || null;
    }

    /**
     * Get current voice channel
     * @param {string} guildId - Guild ID
     * @returns {VoiceChannel|null}
     */
    getCurrentChannel(guildId) {
        return this.currentChannels.get(guildId) || null;
    }

    /**
     * Get queue length for a guild
     * @param {string} guildId - Guild ID
     * @returns {number}
     */
    getQueueLength(guildId) {
        const queue = this.audioQueue.get(guildId) || [];
        return queue.length;
    }

    /**
     * Clear audio queue for a guild
     * @param {string} guildId - Guild ID
     */
    clearQueue(guildId) {
        this.audioQueue.set(guildId, []);
        this.isPlaying.set(guildId, false);
    }
}

module.exports = new VoiceService();

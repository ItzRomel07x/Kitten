const https = require('https');
const logger = require('../utils/logger');

class TTSService {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 100;
    }

    /**
     * Generate speech using Google Translate TTS
     * @param {string} text - Text to convert to speech
     * @param {string} voice - Voice ID to use (language code)
     * @param {number} speed - Speech speed (50-200)
     * @returns {Promise<Buffer>} - Audio buffer
     */
    async generateSpeech(text, voice = 'en', speed = 100) {
        try {
            // Create cache key
            const cacheKey = `${text}-${voice}-${speed}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                logger.debug(`TTS cache hit for: ${text.substring(0, 50)}...`);
                return this.cache.get(cacheKey);
            }

            // Validate inputs
            if (!text || text.trim().length === 0) {
                throw new Error('Text cannot be empty');
            }

            if (text.length > 200) {
                text = text.substring(0, 200); // Limit text length for Google TTS
            }

            // Map voice names to language codes
            const voiceMap = {
                'Joanna': 'en',
                'Matthew': 'en',
                'Amy': 'en-gb',
                'Brian': 'en-gb',
                'Emma': 'en-gb',
                'Olivia': 'en-au',
                'Aria': 'en-au',
                'Ayanda': 'en-za',
                'Ivy': 'en',
                'Kendra': 'en',
                'Kimberly': 'en',
                'Salli': 'en',
                'Joey': 'en',
                'Justin': 'en',
                'Kevin': 'en',
                'Russell': 'en-au',
                'Nicole': 'en-au',
                'Raveena': 'en-in',
                'Geraint': 'en-gb',
                'Celine': 'fr',
                'Mathieu': 'fr',
                'Chantal': 'fr-ca',
                'Marlene': 'de',
                'Hans': 'de',
                'Vicki': 'de',
                'Aditi': 'hi',
                'Carla': 'it',
                'Giorgio': 'it',
                'Bianca': 'it',
                'Mizuki': 'ja',
                'Takumi': 'ja',
                'Seoyeon': 'ko',
                'Conchita': 'es',
                'Enrique': 'es',
                'Penelope': 'es-us',
                'Miguel': 'es-us',
                'Lupe': 'es-us',
                'Mia': 'es-mx',
                'Astrid': 'sv',
                'Liv': 'no',
                'Naja': 'da',
                'Mads': 'da',
                'Ruben': 'nl',
                'Lotte': 'nl',
                'Jacek': 'pl',
                'Ewa': 'pl',
                'Maja': 'pl',
                'Vitoria': 'pt-br',
                'Ricardo': 'pt-br',
                'Cristiano': 'pt',
                'Ines': 'pt',
                'Tatyana': 'ru',
                'Maxim': 'ru',
                'Zhiyu': 'zh'
            };

            const languageCode = voiceMap[voice] || 'en';
            
            logger.debug(`Generating TTS for: "${text.substring(0, 50)}..." with language: ${languageCode}`);

            const audioBuffer = await this.generateWithGoogleTTS(text, languageCode, speed);
            
            // Cache the result
            this.addToCache(cacheKey, audioBuffer);
            
            logger.debug(`TTS generated successfully: ${audioBuffer.length} bytes`);
            return audioBuffer;
            
        } catch (error) {
            logger.error('TTS generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate TTS using Google Translate
     * @param {string} text - Text to convert
     * @param {string} lang - Language code
     * @param {number} speed - Speech speed (0.1-3.0)
     * @returns {Promise<Buffer>} - Audio buffer
     */
    async generateWithGoogleTTS(text, lang, speed) {
        return new Promise((resolve, reject) => {
            // Convert speed from 50-200 to 0.1-3.0 range
            const googleSpeed = Math.max(0.1, Math.min(3.0, speed / 100));
            
            const encodedText = encodeURIComponent(text);
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodedText}&ttsspeed=${googleSpeed}`;
            
            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            };

            https.get(url, options, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const audioBuffer = Buffer.concat(chunks);
                    if (audioBuffer.length > 0) {
                        resolve(audioBuffer);
                    } else {
                        reject(new Error('Empty audio response'));
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Escape special characters for SSML
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeSSML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Add item to cache with size limit
     * @param {string} key - Cache key
     * @param {Buffer} value - Audio buffer
     */
    addToCache(key, value) {
        // Remove oldest items if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, value);
    }

    /**
     * Clear the TTS cache
     */
    clearCache() {
        this.cache.clear();
        logger.info('TTS cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} - Cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize
        };
    }
}

module.exports = new TTSService();

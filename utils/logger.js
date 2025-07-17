const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.logFile = path.join(this.logDir, 'bot.log');
        this.maxLogSize = 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = 5;
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Get current timestamp
     * @returns {string}
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Format log message
     * @param {string} level - Log level
     * @param {string} message - Message
     * @param {any} data - Additional data
     * @returns {string}
     */
    formatMessage(level, message, data) {
        const timestamp = this.getTimestamp();
        let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (data) {
            if (data instanceof Error) {
                logMessage += `\n  Error: ${data.message}`;
                if (data.stack) {
                    logMessage += `\n  Stack: ${data.stack}`;
                }
            } else if (typeof data === 'object') {
                logMessage += `\n  Data: ${JSON.stringify(data, null, 2)}`;
            } else {
                logMessage += ` ${data}`;
            }
        }
        
        return logMessage;
    }

    /**
     * Write log to file
     * @param {string} message - Formatted message
     */
    writeToFile(message) {
        try {
            // Check if log file needs rotation
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                if (stats.size > this.maxLogSize) {
                    this.rotateLogFile();
                }
            }

            fs.appendFileSync(this.logFile, message + '\n');
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }

    /**
     * Rotate log file
     */
    rotateLogFile() {
        try {
            // Move existing log files
            for (let i = this.maxLogFiles - 1; i >= 1; i--) {
                const currentFile = `${this.logFile}.${i}`;
                const nextFile = `${this.logFile}.${i + 1}`;
                
                if (fs.existsSync(currentFile)) {
                    if (i === this.maxLogFiles - 1) {
                        fs.unlinkSync(currentFile); // Delete oldest
                    } else {
                        fs.renameSync(currentFile, nextFile);
                    }
                }
            }

            // Move current log to .1
            if (fs.existsSync(this.logFile)) {
                fs.renameSync(this.logFile, `${this.logFile}.1`);
            }
        } catch (error) {
            console.error('Error rotating log file:', error);
        }
    }

    /**
     * Log info message
     * @param {string} message - Message
     * @param {any} data - Additional data
     */
    info(message, data) {
        const formattedMessage = this.formatMessage('info', message, data);
        console.log(`\x1b[32m${formattedMessage}\x1b[0m`); // Green
        this.writeToFile(formattedMessage);
    }

    /**
     * Log warning message
     * @param {string} message - Message
     * @param {any} data - Additional data
     */
    warn(message, data) {
        const formattedMessage = this.formatMessage('warn', message, data);
        console.warn(`\x1b[33m${formattedMessage}\x1b[0m`); // Yellow
        this.writeToFile(formattedMessage);
    }

    /**
     * Log error message
     * @param {string} message - Message
     * @param {any} data - Additional data
     */
    error(message, data) {
        const formattedMessage = this.formatMessage('error', message, data);
        console.error(`\x1b[31m${formattedMessage}\x1b[0m`); // Red
        this.writeToFile(formattedMessage);
    }

    /**
     * Log debug message
     * @param {string} message - Message
     * @param {any} data - Additional data
     */
    debug(message, data) {
        // Only log debug messages if DEBUG environment variable is set
        if (process.env.DEBUG) {
            const formattedMessage = this.formatMessage('debug', message, data);
            console.log(`\x1b[36m${formattedMessage}\x1b[0m`); // Cyan
            this.writeToFile(formattedMessage);
        }
    }
}

module.exports = new Logger();

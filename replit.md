# Discord Voice Bot

## Overview

This is a Discord bot built with Node.js that provides text-to-speech (TTS) functionality for voice channels. The bot can join voice channels, announce user joins/leaves, and speak custom messages using AWS Polly for voice synthesis. It features customizable voice settings, configurable join/leave phrases, and a command-based interface using Discord slash commands.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Audio Fix Implementation (July 16, 2025)
- Fixed Discord voice connection audio output issues
- Added FFmpeg system dependency for audio processing
- Enhanced audio player logging with status tracking
- Updated audio resource creation with proper format handling
- Added volume control and StreamType configuration
- Installed opusscript package for Discord voice codec support

## System Architecture

### Core Technology Stack
- **Runtime**: Node.js with Discord.js v14
- **Voice Processing**: @discordjs/voice for Discord voice channel integration
- **Text-to-Speech**: AWS Polly for voice synthesis
- **Configuration**: JSON file-based storage for server and user settings

### Application Structure
The bot follows a modular architecture with clear separation of concerns:
- **Entry Point**: `index.js` - Main application bootstrapper
- **Bot Layer**: Command handlers and event listeners
- **Service Layer**: Business logic for voice, TTS, and configuration
- **Utilities**: Logging and helper functions

## Key Components

### Command System
- **Location**: `/bot/commands/`
- **Pattern**: Each command is a separate module with data and execute functions
- **Commands**: join, leave, say, phrase, voice, test
- **Registration**: Automatic command loading and Discord API registration

### Event System
- **Location**: `/bot/events/`
- **Events**: 
  - `ready` - Bot initialization and auto-reconnection
  - `voiceStateUpdate` - User join/leave announcements
  - `interactionCreate` - Slash command handling

### Service Layer
- **Voice Service**: Manages Discord voice connections, audio playback, and channel state
- **TTS Service**: AWS Polly integration with caching for generated audio
- **Config Service**: JSON-based configuration management for user preferences

### Configuration Management
- **Server Configs**: Per-guild settings stored in JSON
- **User Preferences**: Voice settings and custom phrases per user
- **Voice Options**: Predefined voice configurations with language support

## Data Flow

### Command Execution Flow
1. User invokes slash command
2. Discord interaction routed to appropriate command handler
3. Command validates input and permissions
4. Service layer processes business logic
5. Response sent back to user

### Voice Announcement Flow
1. User joins/leaves voice channel
2. `voiceStateUpdate` event triggered
3. Bot checks if announcement needed
4. User's custom phrases retrieved from config
5. TTS service generates audio with user's voice settings
6. Audio played through voice connection

### TTS Processing
1. Text input received with voice/speed parameters
2. Cache checked for existing audio
3. AWS Polly synthesizes speech if not cached
4. Audio buffer returned and played
5. Temporary files cleaned up

## External Dependencies

### Discord Integration
- **discord.js**: Main Discord API wrapper
- **@discordjs/voice**: Voice channel functionality
- **Required Intents**: Guilds, GuildVoiceStates, GuildMessages, MessageContent

### Text-to-Speech Services
- **Google Translate TTS**: Free text-to-speech synthesis via Google Translate API
- **Voice Mapping**: Maps AWS Polly voice names to Google language codes
- **No Authentication**: Uses public Google Translate TTS endpoint
- **FFmpeg Integration**: Required for Discord audio processing and format conversion

### Environment Variables
- `DISCORD_TOKEN`: Bot authentication token
- `DISCORD_CLIENT_ID`: Application ID for command registration
- `AWS_ACCESS_KEY_ID`: AWS credentials
- `AWS_SECRET_ACCESS_KEY`: AWS credentials  
- `AWS_REGION`: AWS region (optional)

## Deployment Strategy

### File Structure
- Configuration files stored in `/config/`
- Temporary audio files in `/temp/`
- Logs written to `/logs/`
- Service modules in `/services/`

### Initialization Process
1. Load and register slash commands
2. Initialize configuration service
3. Set up event listeners
4. Connect to Discord
5. Auto-rejoin previously connected channels (optional)

### Error Handling
- Comprehensive logging system with file rotation
- Graceful failure handling for TTS and voice operations
- User-friendly error messages for command failures

### Scalability Considerations
- In-memory caching for TTS audio
- Connection pooling for voice channels
- JSON-based config suitable for small-to-medium deployments
- Temporary file cleanup to prevent storage issues

### Security Features
- Input validation and sanitization
- Permission checks for voice channel access
- Rate limiting through Discord's built-in mechanisms
- Secure credential management through environment variables
# Render Deployment Guide

## Option 1: Using render.yaml (Recommended)

1. **Connect your GitHub repository to Render:**
   - Push this project to GitHub
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" > "Blueprint"
   - Connect your GitHub repo

2. **The render.yaml file will automatically deploy:**
   - Web service (landing page) on a public URL
   - Worker service (Discord bot) running in background

3. **Set environment variables in Render:**
   - Go to your worker service dashboard
   - Add `DISCORD_TOKEN` with your bot token
   - Add AWS credentials if using AWS TTS (optional)

## Option 2: Manual Deployment

### For Web Service:
1. Create new "Web Service" in Render
2. Set build command: `npm install`
3. Set start command: `node server.js`
4. Set environment: `NODE_ENV=production`

### For Discord Bot:
1. Create new "Background Worker" in Render
2. Set build command: `npm install`  
3. Set start command: `node index.js`
4. Add environment variables:
   - `DISCORD_TOKEN` (required)
   - `AWS_ACCESS_KEY_ID` (optional)
   - `AWS_SECRET_ACCESS_KEY` (optional)
   - `AWS_REGION=us-east-1` (optional)

## Key Differences from Replit:
- **Free tier**: 750 hours/month (sleeps after 15min inactivity)
- **Persistent storage**: Not available on free tier
- **Environment variables**: Set in Render dashboard
- **Logs**: Available in service dashboard
- **Custom domains**: Available on paid plans

## Files needed for deployment:
- ✅ `render.yaml` (created)
- ✅ `package.json` (existing)
- ✅ All source files (existing)

## Cost:
- Free tier: $0/month with limitations
- Starter: $7/month per service for always-on
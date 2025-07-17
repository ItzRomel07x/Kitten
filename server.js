const express = require('express');
const path = require('path');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for the main landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        bot: 'running'
    });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Landing page server started on port ${PORT}`);
    logger.info(`Visit http://localhost:${PORT} to view the landing page`);
});

module.exports = app;

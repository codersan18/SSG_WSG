/**
 * SSG TPG Gateway: an Express server between your system and SSG's Training Partners Gateway.
 * Start with: npm start
 */
const config = require('./config/env'); // loads and checks .env first
const express = require('express');

const tpgRoutes = require('./routes');
const { requireApiKey, notFound, errorHandler } = require('./middleware/http');

const app = express();

// 10mb leaves room for Base64 attachments on the SFC supporting-documents API.
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    ssgEnvironment: config.ssg.isProduction ? 'production' : config.ssg.baseUrl,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/ssg', requireApiKey, tpgRoutes);

app.use(notFound);
app.use(errorHandler);

// Start listening only when run directly (npm start). Tests import the app without starting it.
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`✓ SSG TPG Gateway running at http://localhost:${config.port}`);
  });
}

module.exports = app;

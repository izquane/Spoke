// dev-server.mjs — local API server for development
// Run with: node --env-file=.env dev-server.mjs
// Vite proxies /api requests here (see vite.config.js)

import express from 'express';
import recordingsHandler from './api/recordings.js';
import frameworkHandler from './api/framework.js';

const app = express();
app.use(express.json({ limit: '25mb' }));

app.post('/api/recordings', recordingsHandler);
app.post('/api/framework', frameworkHandler);

app.listen(3001, () => {
  console.log('API server ready at http://localhost:3001');
});

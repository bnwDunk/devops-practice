import { config } from './config.js';
import { closePool } from './db.js';
import { logger } from './logger.js';
import { createApp } from './app.js';

const app = createApp();
const server = app.listen(config.API_PORT, () => {
  logger.info({ port: config.API_PORT }, 'API server listening');
});

async function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, 'Shutting down API server');
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

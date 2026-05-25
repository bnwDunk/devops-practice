import { Router } from 'express';
import { config } from '../config.js';
import { pool } from '../db.js';

export const healthRouter = Router();

const startedAt = Date.now();

healthRouter.get('/', async (_request, response) => {
  const start = performance.now();

  try {
    await pool.query('SELECT 1');
    const latencyMs = Math.round(performance.now() - start);

    response.json({
      status: 'ok',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      database: {
        status: 'ok',
        latencyMs
      },
      version: config.APP_VERSION,
      environment: config.NODE_ENV
    });
  } catch {
    response.status(503).json({
      status: 'degraded',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      database: {
        status: 'error',
        latencyMs: null
      },
      version: config.APP_VERSION,
      environment: config.NODE_ENV
    });
  }
});

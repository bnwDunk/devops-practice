import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { deploymentsRouter } from './routes/deployments.js';
import { healthRouter } from './routes/health.js';
import { metricsRouter } from './routes/metrics.js';
import { logger } from './logger.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      logger,
      customProps: () => ({ service: 'backend-api' })
    })
  );

  app.get('/api', (_request, response) => {
    response.json({ name: 'DevOps Practice API', routes: ['/api/health', '/api/metrics', '/api/deployments'] });
  });
  app.use('/api/health', healthRouter);
  app.use('/api/metrics', metricsRouter);
  app.use('/api/deployments', deploymentsRouter);

  app.use((_request, response) => {
    response.status(404).json({ message: 'Not found' });
  });

  const errorHandler: express.ErrorRequestHandler = (error, _request, response, _next) => {
    logger.error({ error }, 'Unhandled API error');
    response.status(500).json({ message: 'Internal server error' });
  };

  app.use(errorHandler);

  return app;
}

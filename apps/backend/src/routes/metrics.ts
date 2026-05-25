import { Router } from 'express';
import * as client from 'prom-client';

export const metricsRouter = Router();

client.collectDefaultMetrics({
  prefix: 'devops_practice_'
});

const deploymentRequests = new client.Counter({
  name: 'devops_practice_http_deployment_requests_total',
  help: 'Total deployment API requests',
  labelNames: ['method'] as const
});

export function countDeploymentRequest(method: string) {
  deploymentRequests.inc({ method });
}

metricsRouter.get('/', async (_request, response) => {
  response.set('Content-Type', client.register.contentType);
  response.end(await client.register.metrics());
});

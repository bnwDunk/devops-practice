import { Router } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { pool } from '../db.js';
import { countDeploymentRequest } from './metrics.js';

export const deploymentsRouter = Router();

const deploymentSchema = z.object({
  service: z.string().min(2).max(80),
  environment: z.string().min(2).max(40),
  version: z.string().min(2).max(40)
});

type DeploymentRow = RowDataPacket & {
  id: number;
  service: string;
  environment: string;
  version: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  created_at: Date;
};

deploymentsRouter.get('/', async (_request, response, next) => {
  countDeploymentRequest('GET');

  try {
    const [rows] = await pool.query<DeploymentRow[]>(
      `SELECT id, service, environment, version, status, created_at
       FROM deployments
       ORDER BY created_at DESC
       LIMIT 25`
    );

    response.json(
      rows.map((row) => ({
        id: row.id,
        service: row.service,
        environment: row.environment,
        version: row.version,
        status: row.status,
        createdAt: row.created_at
      }))
    );
  } catch (error) {
    next(error);
  }
});

deploymentsRouter.post('/', async (request, response, next) => {
  countDeploymentRequest('POST');

  const parsed = deploymentSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: 'Invalid deployment payload', issues: parsed.error.flatten() });
    return;
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO deployments (service, environment, version, status)
       VALUES (?, ?, ?, 'queued')`,
      [parsed.data.service, parsed.data.environment, parsed.data.version]
    );

    const [rows] = await pool.query<DeploymentRow[]>('SELECT * FROM deployments WHERE id = ?', [result.insertId]);
    const deployment = rows[0];

    response.status(201).json({
      id: deployment.id,
      service: deployment.service,
      environment: deployment.environment,
      version: deployment.version,
      status: deployment.status,
      createdAt: deployment.created_at
    });
  } catch (error) {
    next(error);
  }
});

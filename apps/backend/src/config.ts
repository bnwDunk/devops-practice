import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  MYSQL_HOST: z.string().default('localhost'),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_DATABASE: z.string().default('devops_practice'),
  MYSQL_USER: z.string().default('app_user'),
  MYSQL_PASSWORD: z.string().default('app_password_change_me'),
  APP_VERSION: z.string().default('local')
});

export const config = configSchema.parse(process.env);

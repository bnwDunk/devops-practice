export type ServiceHealth = {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  database: {
    status: 'ok' | 'error';
    latencyMs: number | null;
  };
  version: string;
  environment: string;
};

export type Deployment = {
  id: number;
  service: string;
  environment: string;
  version: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  createdAt: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getHealth() {
  return request<ServiceHealth>('/health');
}

export function listDeployments() {
  return request<Deployment[]>('/deployments');
}

export function createDeployment(payload: Pick<Deployment, 'service' | 'environment' | 'version'>) {
  return request<Deployment>('/deployments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

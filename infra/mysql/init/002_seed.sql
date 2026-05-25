INSERT INTO deployments (service, environment, version, status)
VALUES
  ('frontend-web', 'staging', 'v1.0.0', 'succeeded'),
  ('backend-api', 'staging', 'v1.0.0', 'succeeded'),
  ('backend-api', 'production', 'v0.9.7', 'running');

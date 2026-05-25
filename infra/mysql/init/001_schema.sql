CREATE TABLE IF NOT EXISTS deployments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  service VARCHAR(80) NOT NULL,
  environment VARCHAR(40) NOT NULL,
  version VARCHAR(40) NOT NULL,
  status ENUM('queued', 'running', 'succeeded', 'failed') NOT NULL DEFAULT 'queued',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_deployments_created_at (created_at),
  INDEX idx_deployments_service_environment (service, environment)
);

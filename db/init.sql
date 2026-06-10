CREATE DATABASE IF NOT EXISTS tasks_db;
USE tasks_db;

CREATE TABLE IF NOT EXISTS tasks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL,
  description TEXT,
  status      ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME     NULL,

  CONSTRAINT chk_completed_at
    CHECK (
      (status = 'completed' AND completed_at IS NOT NULL AND completed_at >= created_at)
      OR (status != 'completed' AND completed_at IS NULL)
    )
);

-- Seed data for demonstration
INSERT INTO tasks (title, description, status, created_at, completed_at) VALUES
  ('Setup project repository',   'Initialize git repo and push initial commit', 'completed', '2026-06-01 09:00:00', '2026-06-01 10:30:00'),
  ('Design database schema',     'Define tables and relationships',              'completed', '2026-06-01 11:00:00', '2026-06-02 14:00:00'),
  ('Build REST API',             'Implement CRUD endpoints with Express',        'in_progress','2026-06-03 09:00:00', NULL),
  ('Write unit tests',           'Cover models, routes and metrics',             'pending',    '2026-06-04 09:00:00', NULL),
  ('Create Docker configuration','Set up docker-compose for app and db',         'completed',  '2026-06-05 08:00:00', '2026-06-05 11:00:00'),
  ('Deploy to staging',          'Push image to registry and deploy',            'pending',    '2026-06-06 09:00:00', NULL),
  ('Code review',                'Review PR from team member',                   'cancelled',  '2026-06-02 09:00:00', NULL);

-- Create the database and database user first in Hostinger hPanel.
-- Import this file inside the chosen database using phpMyAdmin or Beekeeper Studio.
-- User-uploaded document contents are NEVER stored in this schema.
CREATE TABLE IF NOT EXISTS users (
 id CHAR(36) PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(190) NOT NULL UNIQUE,
 password_hash CHAR(128) NOT NULL,
 password_salt CHAR(32) NOT NULL,
 role ENUM('user','admin') NOT NULL DEFAULT 'user',
 active TINYINT(1) NOT NULL DEFAULT 1,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS sessions (
 token_hash CHAR(64) PRIMARY KEY,
 user_id CHAR(36) NOT NULL,
 expires_at DATETIME NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_sessions_user (user_id),
 INDEX idx_sessions_expiry (expires_at),
 CONSTRAINT fk_sessions_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS activity (
 id CHAR(36) PRIMARY KEY,
 user_id CHAR(36) NOT NULL,
 tool VARCHAR(90) NOT NULL,
 status ENUM('client_reported') NOT NULL DEFAULT 'client_reported',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_activity_user_time (user_id,created_at),
 CONSTRAINT fk_activity_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS contact_messages (
 id CHAR(36) PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(190) NOT NULL,
 message TEXT NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_contact_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plans describe configured capabilities. Paid plans are disabled until payments exist.
CREATE TABLE IF NOT EXISTS subscription_plans (
 id VARCHAR(20) PRIMARY KEY,
 name VARCHAR(40) NOT NULL,
 enabled TINYINT(1) NOT NULL DEFAULT 0,
 max_file_bytes INT UNSIGNED NOT NULL,
 max_task_bytes INT UNSIGNED NOT NULL,
 max_files SMALLINT UNSIGNED NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO subscription_plans (id,name,enabled,max_file_bytes,max_task_bytes,max_files) VALUES
 ('free','Free',1,15728640,47185920,12),
 ('pro','Pro',0,15728640,47185920,12),
 ('business','Business',0,15728640,47185920,12);
CREATE TABLE IF NOT EXISTS subscriptions (
 user_id CHAR(36) PRIMARY KEY,
 plan_id VARCHAR(20) NOT NULL DEFAULT 'free',
 status ENUM('active','cancelled','expired') NOT NULL DEFAULT 'active',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX idx_subscriptions_plan (plan_id,status),
 CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

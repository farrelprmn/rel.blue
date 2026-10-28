-- schema from presequities/uml.uxf, for MySQL 8

-- admin login
CREATE TABLE `user` (
  clerk_user VARCHAR(100) PRIMARY KEY,
  token      VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE projects (
  project_id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  -- MySQL has no timestamptz; TIMESTAMP is stored as UTC and shown in the session time zone
  `timestamp`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  project_name        VARCHAR(50) NOT NULL,
  -- not in the UML: names the window on the projects page (~/projects/<slug>)
  project_slug        VARCHAR(50) NOT NULL DEFAULT '',
  project_description TEXT,
  project_image_link  TEXT,
  -- not in the UML: the "view project" link
  project_link        TEXT,
  project_duration    VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE achievements (
  achievements_id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  -- 100, not 50: names like "Indonesia International Applied Science Project Olympiad (I2ASPO)" run past 50
  achievements_name VARCHAR(100) NOT NULL,
  -- not in the UML: the award text and trophy colour shown on the achievements page
  achievements_award VARCHAR(100),
  achievements_tier  ENUM('gold', 'silver') NOT NULL DEFAULT 'gold',
  achievements_year YEAR,
  achievements_desc TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- one achievement, many images
CREATE TABLE achievements_image (
  image_id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  achievements_id BIGINT UNSIGNED NOT NULL,
  image_url       TEXT NOT NULL,
  CONSTRAINT fk_achievements_image_achievements
    FOREIGN KEY (achievements_id) REFERENCES achievements (achievements_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

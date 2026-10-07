-- The application database is evege_db (configured by SPRING_DATASOURCE_URL).
-- Keep these statements idempotent so deployments can safely restart.
CREATE TABLE IF NOT EXISTS student_accounts (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255),
    college VARCHAR(255),
    branch VARCHAR(255),
    roll_number VARCHAR(255),
    year_semester VARCHAR(255),
    gender VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_accounts (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255),
    college VARCHAR(255),
    branch VARCHAR(255),
    roll_number VARCHAR(255),
    year_semester VARCHAR(255),
    gender VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255),
    college VARCHAR(255),
    branch VARCHAR(255),
    roll_number VARCHAR(255),
    year_semester VARCHAR(255),
    gender VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

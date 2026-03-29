-- ============================================================
-- Smart City Pothole Detection System — PostgreSQL Schema
-- ============================================================
-- Run this AFTER creating the database:
--   psql -U pothole_user -d pothole_db -f schema.sql

-- Users
CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL CHECK (role IN ('CITIZEN','MUNICIPAL_OFFICIAL','CONTRACTOR')),
    name       VARCHAR(255) NOT NULL,
    phone      VARCHAR(20),
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Contractor profiles (one-to-one with users where role = CONTRACTOR)
CREATE TABLE IF NOT EXISTS contractor_profiles (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name        VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL UNIQUE,
    rating              DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    completed_jobs      INT          NOT NULL DEFAULT 0
);

-- Pothole reports
CREATE TABLE IF NOT EXISTS pothole_reports (
    id                 BIGSERIAL PRIMARY KEY,
    citizen_id         BIGINT        NOT NULL REFERENCES users(id),
    image_url          VARCHAR(500)  NOT NULL,
    latitude           DECIMAL(10,7) NOT NULL,
    longitude          DECIMAL(10,7) NOT NULL,
    address            VARCHAR(500),
    severity           VARCHAR(10)   CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    status             VARCHAR(30)   NOT NULL DEFAULT 'PENDING_AI'
                           CHECK (status IN (
                               'PENDING_AI','AI_VERIFIED','REJECTED',
                               'RFQ_GENERATED','ASSIGNED','IN_PROGRESS','COMPLETED'
                           )),
    ai_confidence      DECIMAL(5,4),
    estimated_diameter DECIMAL(6,2),
    estimated_depth    DECIMAL(6,2),
    created_at         TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pothole_updated_at ON pothole_reports;
CREATE TRIGGER trg_pothole_updated_at
BEFORE UPDATE ON pothole_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RFQs
CREATE TABLE IF NOT EXISTS rfqs (
    id                BIGSERIAL PRIMARY KEY,
    pothole_report_id BIGINT      NOT NULL UNIQUE REFERENCES pothole_reports(id),
    generated_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    deadline          TIMESTAMP   NOT NULL,
    status            VARCHAR(10) NOT NULL DEFAULT 'OPEN'
                          CHECK (status IN ('OPEN','CLOSED','AWARDED'))
);

-- Bids
CREATE TABLE IF NOT EXISTS bids (
    id              BIGSERIAL PRIMARY KEY,
    rfq_id          BIGINT        NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    contractor_id   BIGINT        NOT NULL REFERENCES users(id),
    price           DECIMAL(12,2) NOT NULL CHECK (price > 0),
    completion_days INT           NOT NULL CHECK (completion_days > 0),
    repair_method   TEXT          NOT NULL,
    submitted_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    weighted_score  DECIMAL(8,6),
    UNIQUE (rfq_id, contractor_id)
);

-- Repair tasks
CREATE TABLE IF NOT EXISTS repair_tasks (
    id               BIGSERIAL PRIMARY KEY,
    bid_id           BIGINT      NOT NULL UNIQUE REFERENCES bids(id),
    assigned_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    status           VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED'
                         CHECK (status IN ('ASSIGNED','IN_PROGRESS','COMPLETED')),
    before_image_url VARCHAR(500),
    after_image_url  VARCHAR(500),
    completed_at     TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pothole_status    ON pothole_reports(status);
CREATE INDEX IF NOT EXISTS idx_pothole_severity  ON pothole_reports(severity);
CREATE INDEX IF NOT EXISTS idx_pothole_citizen   ON pothole_reports(citizen_id);
CREATE INDEX IF NOT EXISTS idx_pothole_location  ON pothole_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_rfq_status        ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_bid_rfq           ON bids(rfq_id);
CREATE INDEX IF NOT EXISTS idx_bid_contractor    ON bids(contractor_id);

-- ═══════════════════════════════════════════════════════════════════
-- SNHRC — Service & Depreciation Management System
-- Migration: Phase 1 Foundation
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- TABLE 1: depreciation_config — Per-category depreciation rules
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS depreciation_config (
    id                  SERIAL PRIMARY KEY,
    category_id         INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    method              VARCHAR(10) NOT NULL DEFAULT 'SLM',
    useful_life_years   INTEGER NOT NULL DEFAULT 10,
    residual_percent    NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    annual_rate         NUMERIC(5,2),
    service_cost_threshold_percent NUMERIC(5,2) NOT NULL DEFAULT 50.00,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    UNIQUE(category_id)
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE 2: service_records — Every service/repair event
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_records (
    id                  SERIAL PRIMARY KEY,
    asset_code          VARCHAR(50) NOT NULL REFERENCES assets(asset_code),
    service_type        VARCHAR(30) NOT NULL DEFAULT 'corrective',
    service_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    description         TEXT NOT NULL,
    vendor_name         VARCHAR(255),
    labor_cost          NUMERIC(12,2) DEFAULT 0,
    parts_cost          NUMERIC(12,2) DEFAULT 0,
    total_cost          NUMERIC(12,2) GENERATED ALWAYS AS (labor_cost + parts_cost) STORED,
    parts_replaced      TEXT,
    next_service_date   DATE,
    document_id         INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    performed_by        VARCHAR(255),
    logged_by           INTEGER REFERENCES users(id),
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE 3: condemnation_requests — Approval workflow
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS condemnation_requests (
    id                  SERIAL PRIMARY KEY,
    asset_code          VARCHAR(50) NOT NULL REFERENCES assets(asset_code),
    reason              TEXT NOT NULL,
    reason_category     VARCHAR(50) NOT NULL DEFAULT 'beyond_repair',
    purchase_cost       NUMERIC(12,2),
    current_book_value  NUMERIC(12,2),
    total_service_cost  NUMERIC(12,2),
    service_cost_ratio  NUMERIC(5,2),
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_by        INTEGER NOT NULL REFERENCES users(id),
    reviewed_by         INTEGER REFERENCES users(id),
    review_date         TIMESTAMP,
    review_comments     TEXT,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE 4: asset_disposals — Post-condemnation disposal records
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asset_disposals (
    id                  SERIAL PRIMARY KEY,
    asset_code          VARCHAR(50) NOT NULL REFERENCES assets(asset_code),
    condemnation_id     INTEGER NOT NULL REFERENCES condemnation_requests(id),
    disposal_method     VARCHAR(30) NOT NULL DEFAULT 'scrap',
    disposal_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_recovered    NUMERIC(12,2) DEFAULT 0,
    buyer_recipient     VARCHAR(255),
    certificate_number  VARCHAR(100),
    disposal_notes      TEXT,
    disposed_by         INTEGER NOT NULL REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────
-- INDEXES
-- ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_service_records_asset ON service_records(asset_code);
CREATE INDEX IF NOT EXISTS idx_service_records_date ON service_records(service_date);
CREATE INDEX IF NOT EXISTS idx_service_records_type ON service_records(service_type);
CREATE INDEX IF NOT EXISTS idx_condemnation_status ON condemnation_requests(status);
CREATE INDEX IF NOT EXISTS idx_condemnation_asset ON condemnation_requests(asset_code);
CREATE INDEX IF NOT EXISTS idx_disposal_asset ON asset_disposals(asset_code);

-- ───────────────────────────────────────────────────────────────────
-- DEFAULT DEPRECIATION CONFIGS (per Indian Companies Act Schedule II)
-- ───────────────────────────────────────────────────────────────────
-- These will be inserted after verifying category IDs exist
-- Medical Equipment:  13 years useful life, SLM, 5% residual
-- IT Equipment:        3 years useful life, SLM, 5% residual
-- Furniture:          10 years useful life, SLM, 5% residual
-- Vehicles:            8 years useful life, WDV, 15% rate
-- Electrical:         10 years useful life, SLM, 5% residual
-- Lab Equipment:      10 years useful life, SLM, 5% residual

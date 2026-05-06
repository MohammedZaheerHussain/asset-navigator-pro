-- ============================================================
-- SNHRC Reports System — Database Migration
-- Multi-User Report Update System with Audit Trail
-- ============================================================

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id              SERIAL PRIMARY KEY,
    report_type     VARCHAR(50) NOT NULL CHECK (report_type IN ('material', 'acid', 'other')),
    title           VARCHAR(255) NOT NULL,
    branch_id       INTEGER NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    total_quantity  NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit            VARCHAR(30) NOT NULL DEFAULT 'units' CHECK (unit IN ('kg', 'liters', 'units', 'pieces', 'meters', 'bottles', 'packets', 'boxes')),
    remarks         TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    last_updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Update History (Audit Trail)
CREATE TABLE IF NOT EXISTS report_updates (
    id              SERIAL PRIMARY KEY,
    report_id       INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    updated_by      INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    change_type     VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'archive', 'restore')),
    previous_value  JSONB,
    new_value       JSONB NOT NULL,
    change_summary  TEXT,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reports_type       ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_branch     ON reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_reports_dept       ON reports(department_id);
CREATE INDEX IF NOT EXISTS idx_reports_status     ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_updated    ON reports(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_updates_rid ON report_updates(report_id);
CREATE INDEX IF NOT EXISTS idx_report_updates_uid ON report_updates(updated_by);

-- Seed some sample reports
INSERT INTO reports (report_type, title, branch_id, department_id, total_quantity, unit, remarks, created_by, last_updated_by) VALUES
    ('material', 'Monthly Medical Supplies Stock', 1, 1, 2500.00, 'units', 'Regular stock count for Q2 2026', 1, 1),
    ('material', 'IT Equipment Inventory', 1, 2, 450.00, 'units', 'All IT devices including peripherals', 1, 1),
    ('acid', 'Laboratory Acid Inventory', 1, 3, 85.50, 'liters', 'HCl, H2SO4, HNO3 combined stock', 1, 1),
    ('acid', 'Pharmacy Chemical Stock', 2, 5, 120.00, 'liters', 'Pharmacy-grade chemicals', 1, 1),
    ('material', 'North Wing Surgical Supplies', 2, 4, 1800.00, 'units', 'Surgical tools and consumables', 1, 1),
    ('other', 'Biomedical Waste Report', 1, 1, 340.00, 'kg', 'Monthly biomedical waste generated', 1, 1),
    ('material', 'Cardiology Equipment Count', 1, 4, 75.00, 'pieces', 'Cardiology department equipment', 1, 1),
    ('other', 'Safety Equipment Audit', 1, 6, 200.00, 'units', 'Fire extinguishers, first aid kits', 1, 1)
ON CONFLICT DO NOTHING;

-- Seed audit trail for sample data
INSERT INTO report_updates (report_id, updated_by, change_type, previous_value, new_value, change_summary) VALUES
    (1, 1, 'create', NULL, '{"total_quantity": 2500, "unit": "units"}', 'Report created'),
    (2, 1, 'create', NULL, '{"total_quantity": 450, "unit": "units"}', 'Report created'),
    (3, 1, 'create', NULL, '{"total_quantity": 85.5, "unit": "liters"}', 'Report created')
ON CONFLICT DO NOTHING;

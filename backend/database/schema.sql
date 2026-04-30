-- ============================================================
-- SNHRC Asset Management System - PostgreSQL Database Schema
-- Version: 1.0.0
-- ============================================================

-- Enable UUID extension (optional, for future use)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. BRANCHES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    head_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, branch_id)
);

-- ============================================================
-- 5. ASSETS TABLE (Core Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
    asset_code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    barcode VARCHAR(100) UNIQUE,
    serial_number VARCHAR(100) UNIQUE,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'inactive', 'in_transfer', 'maintenance', 'disposed', 'lost'
    )),
    assigned_to VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    warranty_expiry DATE,
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. TRANSFERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(50) NOT NULL REFERENCES assets(asset_code) ON DELETE RESTRICT,
    from_branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    from_department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    to_branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    to_department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_transit', 'completed', 'cancelled'
    )),
    initiated_by INTEGER REFERENCES users(id),
    completed_by INTEGER REFERENCES users(id),
    reason TEXT,
    notes TEXT,
    initiated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    asset_code VARCHAR(50) REFERENCES assets(asset_code) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'created', 'updated', 'deleted', 'restored',
        'transferred', 'transfer_completed', 'transfer_cancelled',
        'status_changed', 'assigned', 'unassigned'
    )),
    details JSONB,
    performed_by INTEGER REFERENCES users(id),
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES (Performance Critical)
-- ============================================================

-- Asset lookups (barcode scanner & search)
CREATE INDEX idx_assets_barcode ON assets(barcode);
CREATE INDEX idx_assets_serial_number ON assets(serial_number);
CREATE INDEX idx_assets_asset_code ON assets(asset_code);

-- Asset filtering
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_category_id ON assets(category_id);
CREATE INDEX idx_assets_branch_id ON assets(branch_id);
CREATE INDEX idx_assets_department_id ON assets(department_id);
CREATE INDEX idx_assets_is_deleted ON assets(is_deleted);
CREATE INDEX idx_assets_warranty_expiry ON assets(warranty_expiry);
CREATE INDEX idx_assets_assigned_to ON assets(assigned_to);

-- Transfer lookups
CREATE INDEX idx_transfers_asset_code ON transfers(asset_code);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_from_branch ON transfers(from_branch_id);
CREATE INDEX idx_transfers_to_branch ON transfers(to_branch_id);

-- Activity log lookups
CREATE INDEX idx_activity_logs_asset_code ON activity_logs(asset_code);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_performed_by ON activity_logs(performed_by);

-- Department lookups
CREATE INDEX idx_departments_branch_id ON departments(branch_id);

-- ============================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_transfers_updated_at
    BEFORE UPDATE ON transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

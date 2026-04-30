-- ============================================================
-- SNHRC Asset Management System - MySQL Database Schema
-- Compatible with MySQL 8.x
-- ============================================================

CREATE DATABASE IF NOT EXISTS snhrc_assets
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE snhrc_assets;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 3. BRANCHES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 4. DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    branch_id INT NOT NULL,
    head_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_dept_branch (name, branch_id),
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 5. ASSETS TABLE (Core Table)
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
    asset_code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    serial_number VARCHAR(100) UNIQUE,
    branch_id INT NOT NULL,
    department_id INT NOT NULL,
    status ENUM('active', 'inactive', 'in_transfer', 'maintenance', 'disposed', 'lost') NOT NULL DEFAULT 'active',
    assigned_to VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    warranty_expiry DATE,
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 6. TRANSFERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS transfers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(50) NOT NULL,
    from_branch_id INT NOT NULL,
    from_department_id INT NOT NULL,
    to_branch_id INT NOT NULL,
    to_department_id INT NOT NULL,
    status ENUM('pending', 'in_transit', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    initiated_by INT,
    completed_by INT,
    reason TEXT,
    notes TEXT,
    initiated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_code) REFERENCES assets(asset_code) ON DELETE RESTRICT,
    FOREIGN KEY (from_branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    FOREIGN KEY (from_department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (to_branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    FOREIGN KEY (to_department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (initiated_by) REFERENCES users(id),
    FOREIGN KEY (completed_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- 7. ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(50),
    action ENUM('created', 'updated', 'deleted', 'restored', 'transferred', 'transfer_completed', 'transfer_cancelled', 'status_changed', 'assigned', 'unassigned') NOT NULL,
    details JSON,
    performed_by INT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_code) REFERENCES assets(asset_code) ON DELETE SET NULL,
    FOREIGN KEY (performed_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- INDEXES (Performance Critical)
-- ============================================================

-- Asset lookups (barcode scanner & search)
CREATE INDEX idx_assets_barcode ON assets(barcode);
CREATE INDEX idx_assets_serial_number ON assets(serial_number);
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

-- ============================================================
-- PROCUREMENT & SUPPLY MANAGEMENT MODULE
-- Migration Script — Run on PostgreSQL (Render)
-- ============================================================

-- 1. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(20) NOT NULL UNIQUE,
    supplier_name VARCHAR(200) NOT NULL,
    dealer_name VARCHAR(200),
    supplier_type VARCHAR(50) NOT NULL DEFAULT 'general'
        CHECK (supplier_type IN ('medical','electrical','furniture','it','lab','general','kitchen','plumbing','safety','vehicles')),
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    email VARCHAR(100),
    address_line1 TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    gst_number VARCHAR(20),
    pan_number VARCHAR(15),
    payment_terms VARCHAR(100) DEFAULT 'net30',
    is_preferred BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    remarks TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PURCHASES
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    purchase_code VARCHAR(20) NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receiving_branch_id INTEGER NOT NULL REFERENCES branches(id),
    receiving_department_id INTEGER REFERENCES departments(id),
    subtotal DECIMAL(14,2) DEFAULT 0,
    gst_amount DECIMAL(14,2) DEFAULT 0,
    discount_amount DECIMAL(14,2) DEFAULT 0,
    grand_total DECIMAL(14,2) DEFAULT 0,
    auto_generate_assets BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft','pending','approved','rejected','completed')),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    purchase_notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    warranty_months INTEGER DEFAULT 0,
    serial_prefix VARCHAR(50),
    total_price DECIMAL(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. PURCHASE INVOICES (file metadata)
CREATE TABLE IF NOT EXISTS purchase_invoices (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. PURCHASE → ASSET LINKS
CREATE TABLE IF NOT EXISTS purchase_asset_links (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id),
    purchase_item_id INTEGER NOT NULL REFERENCES purchase_items(id),
    asset_code VARCHAR(50) NOT NULL REFERENCES assets(asset_code),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_purchase ON purchase_invoices(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_asset_links_purchase ON purchase_asset_links(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_asset_links_asset ON purchase_asset_links(asset_code);

-- TRIGGERS
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_purchases_updated_at BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

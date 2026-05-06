-- ============================================================
-- Documents Table — stores invoices & service bills in DB
-- Files stored as bytea to survive ephemeral filesystem
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
    id              SERIAL PRIMARY KEY,
    asset_code      VARCHAR(50)     REFERENCES assets(asset_code) ON DELETE SET NULL,
    document_type   VARCHAR(30)     NOT NULL CHECK (document_type IN ('invoice', 'service_bill', 'warranty', 'other')),
    title           VARCHAR(255)    NOT NULL,
    original_filename VARCHAR(255)  NOT NULL,
    mime_type       VARCHAR(100)    NOT NULL,
    file_size       INTEGER         NOT NULL,
    file_data       BYTEA           NOT NULL,
    notes           TEXT,
    uploaded_by     INTEGER         REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX idx_documents_asset_code ON documents(asset_code);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

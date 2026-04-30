-- ============================================================
-- SNHRC Asset Management System - MySQL Seed Data
-- ============================================================

USE snhrc_assets;

-- Default Admin User (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@snhrc.org', '$2y$10$522uDP/LzEJbZGqUOnXxtOWR959D2jrG95IJ.Saa8OEratQMcmiVq', 'System Administrator', 'admin'),
('staff1', 'staff1@snhrc.org', '$2y$10$522uDP/LzEJbZGqUOnXxtOWR959D2jrG95IJ.Saa8OEratQMcmiVq', 'Staff User One', 'staff'),
('staff2', 'staff2@snhrc.org', '$2y$10$522uDP/LzEJbZGqUOnXxtOWR959D2jrG95IJ.Saa8OEratQMcmiVq', 'Staff User Two', 'staff');

-- Categories
INSERT INTO categories (name, description) VALUES
('Medical Equipment', 'Hospital medical devices and instruments'),
('IT Equipment', 'Computers, servers, networking equipment'),
('Furniture', 'Office and hospital furniture'),
('Vehicles', 'Hospital vehicles and ambulances'),
('Electrical', 'Electrical fixtures, generators, UPS systems'),
('Plumbing', 'Plumbing fixtures and equipment'),
('Kitchen Equipment', 'Canteen and kitchen appliances'),
('Lab Equipment', 'Laboratory instruments and devices'),
('Safety Equipment', 'Fire safety, security cameras, alarms'),
('Office Supplies', 'Printers, scanners, stationery machines');

-- Branches
INSERT INTO branches (name, code, address, city, state, contact_phone, contact_email) VALUES
('SNHRC Main Hospital', 'SNHRC-MAIN', '123 Temple Road', 'Chennai', 'Tamil Nadu', '+91-44-12345678', 'main@snhrc.org'),
('SNHRC North Wing', 'SNHRC-NORTH', '124 Temple Road', 'Chennai', 'Tamil Nadu', '+91-44-12345679', 'north@snhrc.org'),
('SNHRC South Campus', 'SNHRC-SOUTH', '500 Beach Road', 'Chennai', 'Tamil Nadu', '+91-44-12345680', 'south@snhrc.org'),
('SNHRC Research Center', 'SNHRC-RES', '200 Research Park', 'Chennai', 'Tamil Nadu', '+91-44-12345681', 'research@snhrc.org');

-- Departments
INSERT INTO departments (name, code, branch_id, head_name) VALUES
('General Medicine', 'GEN-MED', 1, 'Dr. Rajesh Kumar'),
('Cardiology', 'CARD', 1, 'Dr. Priya Sharma'),
('Radiology', 'RAD', 1, 'Dr. Arun Patel'),
('IT Department', 'IT', 1, 'Mr. Suresh Nair'),
('Administration', 'ADMIN', 1, 'Mrs. Lakshmi Devi'),
('Emergency', 'EMRG', 1, 'Dr. Vikram Singh'),
('Pharmacy', 'PHAR', 2, 'Dr. Meena Rao'),
('Pathology', 'PATH', 2, 'Dr. Anand Krishnan'),
('Orthopedics', 'ORTHO', 2, 'Dr. Sanjay Gupta'),
('Pediatrics', 'PED', 3, 'Dr. Deepa Menon'),
('Research Lab', 'RES-LAB', 4, 'Dr. Karthik Raman'),
('Bio-Medical', 'BIO-MED', 4, 'Dr. Sunita Joshi');

-- Sample Assets
INSERT INTO assets (asset_code, name, description, category_id, barcode, serial_number, branch_id, department_id, status, assigned_to, purchase_date, purchase_cost, warranty_expiry) VALUES
('AST-MED-001', 'Philips MRI Scanner', '3T MRI Scanner - Model Ingenia', 1, 'BAR001MRI2024', 'SN-PHI-MRI-78234', 1, 3, 'active', 'Dr. Arun Patel', '2023-06-15', 45000000.00, '2028-06-15'),
('AST-MED-002', 'GE Ultrasound Machine', 'Portable ultrasound - LOGIQ E10', 1, 'BAR002USG2024', 'SN-GE-USG-45123', 1, 2, 'active', 'Dr. Priya Sharma', '2023-08-20', 3500000.00, '2026-08-20'),
('AST-MED-003', 'Ventilator ICU', 'Hamilton G5 ICU Ventilator', 1, 'BAR003VNT2024', 'SN-HAM-VNT-90876', 1, 6, 'active', 'Dr. Vikram Singh', '2024-01-10', 1800000.00, '2029-01-10'),
('AST-IT-001', 'Dell PowerEdge Server', 'R740 Rack Server - 64GB RAM', 2, 'BAR004SRV2024', 'SN-DEL-SRV-12345', 1, 4, 'active', 'Mr. Suresh Nair', '2023-11-01', 850000.00, '2026-11-01'),
('AST-IT-002', 'HP LaserJet Printer', 'Color LaserJet Pro MFP M479fdw', 2, 'BAR005PRT2024', 'SN-HP-PRT-67890', 1, 5, 'active', 'Mrs. Lakshmi Devi', '2024-02-15', 45000.00, '2025-02-15'),
('AST-FUR-001', 'Executive Desk', 'L-shaped executive desk with drawers', 3, 'BAR006DSK2024', 'SN-FUR-DSK-11111', 1, 5, 'active', 'Mrs. Lakshmi Devi', '2023-03-01', 25000.00, NULL),
('AST-VEH-001', 'Toyota Ambulance', 'HiAce Ambulance - Fully Equipped', 4, 'BAR007AMB2024', 'SN-TOY-AMB-99001', 1, 6, 'active', 'Emergency Dept', '2023-05-10', 3200000.00, '2026-05-10'),
('AST-ELE-001', 'Kirloskar Generator', '500 KVA Diesel Generator', 5, 'BAR008GEN2024', 'SN-KIR-GEN-55001', 1, 4, 'active', 'IT Department', '2022-12-01', 2500000.00, '2027-12-01'),
('AST-LAB-001', 'Centrifuge Machine', 'High-speed Research Centrifuge', 8, 'BAR009CNT2024', 'SN-LAB-CNT-33001', 4, 11, 'active', 'Dr. Karthik Raman', '2024-03-01', 750000.00, '2029-03-01'),
('AST-MED-004', 'Patient Monitor', 'Philips IntelliVue MX800', 1, 'BAR010MON2024', 'SN-PHI-MON-44001', 2, 7, 'in_transfer', NULL, '2024-01-15', 450000.00, '2027-01-15'),
('AST-SAF-001', 'CCTV System', 'Hikvision 32-Channel NVR + 32 Cameras', 9, 'BAR011CTV2024', 'SN-HIK-CTV-77001', 1, 4, 'active', 'Security Team', '2023-09-01', 350000.00, '2026-09-01'),
('AST-IT-003', 'Cisco Network Switch', 'Catalyst 9300 48-Port', 2, 'BAR012NSW2024', 'SN-CIS-NSW-88001', 1, 4, 'maintenance', 'Mr. Suresh Nair', '2023-07-15', 280000.00, '2026-07-15');

-- Sample Transfers
INSERT INTO transfers (asset_code, from_branch_id, from_department_id, to_branch_id, to_department_id, status, initiated_by, reason) VALUES
('AST-MED-004', 2, 7, 1, 2, 'in_transit', 1, 'Required in Cardiology for patient monitoring'),
('AST-IT-002', 1, 5, 3, 10, 'completed', 1, 'Printer relocated to Pediatrics department');

UPDATE transfers SET completed_by = 1, completed_at = NOW() WHERE id = 2;

-- Sample Activity Logs
INSERT INTO activity_logs (asset_code, action, details, performed_by) VALUES
('AST-MED-001', 'created', '{"message": "New MRI Scanner registered"}', 1),
('AST-MED-002', 'created', '{"message": "New Ultrasound Machine registered"}', 1),
('AST-IT-001', 'created', '{"message": "New Server registered"}', 1),
('AST-MED-004', 'transferred', '{"from_branch": "SNHRC North Wing", "to_branch": "SNHRC Main Hospital"}', 1),
('AST-IT-003', 'status_changed', '{"old_status": "active", "new_status": "maintenance"}', 1),
('AST-IT-002', 'transferred', '{"from_branch": "SNHRC Main Hospital", "to_branch": "SNHRC South Campus"}', 1);

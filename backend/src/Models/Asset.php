<?php

namespace App\Models;

/**
 * Asset Model
 * 
 * Core model for the asset management system.
 * Uses asset_code as primary key (not auto-increment).
 */
class Asset extends Model
{
    protected $table = 'assets';
    protected $primaryKey = 'asset_code';

    /**
     * Get asset with full details (joins category, branch, department)
     */
    public function findWithDetails(string $assetCode): ?array
    {
        $sql = "SELECT 
                    a.*,
                    c.name AS category_name,
                    b.name AS branch_name,
                    b.code AS branch_code,
                    d.name AS department_name,
                    d.code AS department_code
                FROM {$this->table} a
                LEFT JOIN categories c ON a.category_id = c.id
                LEFT JOIN branches b ON a.branch_id = b.id
                LEFT JOIN departments d ON a.department_id = d.id
                WHERE a.asset_code = ? AND a.is_deleted = false";
        return $this->db->fetch($sql, [$assetCode]);
    }

    /**
     * Search by barcode (optimized with index)
     */
    public function findByBarcode(string $barcode): ?array
    {
        $sql = "SELECT 
                    a.*,
                    c.name AS category_name,
                    b.name AS branch_name,
                    b.code AS branch_code,
                    d.name AS department_name,
                    d.code AS department_code
                FROM {$this->table} a
                LEFT JOIN categories c ON a.category_id = c.id
                LEFT JOIN branches b ON a.branch_id = b.id
                LEFT JOIN departments d ON a.department_id = d.id
                WHERE a.barcode = ? AND a.is_deleted = false";
        return $this->db->fetch($sql, [$barcode]);
    }

    /**
     * Search by serial number (optimized with index)
     */
    public function findBySerialNumber(string $serialNumber): ?array
    {
        $sql = "SELECT 
                    a.*,
                    c.name AS category_name,
                    b.name AS branch_name,
                    b.code AS branch_code,
                    d.name AS department_name,
                    d.code AS department_code
                FROM {$this->table} a
                LEFT JOIN categories c ON a.category_id = c.id
                LEFT JOIN branches b ON a.branch_id = b.id
                LEFT JOIN departments d ON a.department_id = d.id
                WHERE a.serial_number = ? AND a.is_deleted = false";
        return $this->db->fetch($sql, [$serialNumber]);
    }

    /**
     * Get paginated assets with filters
     */
    public function getPaginated(array $filters = [], int $page = 1, int $perPage = 20): array
    {
        $where = ['a.is_deleted = false'];
        $params = [];

        if (!empty($filters['status'])) {
            $where[] = 'a.status = ?';
            $params[] = $filters['status'];
        }
        if (!empty($filters['category_id'])) {
            $where[] = 'a.category_id = ?';
            $params[] = $filters['category_id'];
        }
        if (!empty($filters['branch_id'])) {
            $where[] = 'a.branch_id = ?';
            $params[] = $filters['branch_id'];
        }
        if (!empty($filters['department_id'])) {
            $where[] = 'a.department_id = ?';
            $params[] = $filters['department_id'];
        }
        if (!empty($filters['search'])) {
            $where[] = '(a.name ILIKE ? OR a.asset_code ILIKE ? OR a.barcode ILIKE ? OR a.serial_number ILIKE ?)';
            $searchTerm = '%' . $filters['search'] . '%';
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
        }

        $whereClause = implode(' AND ', $where);
        $offset = ($page - 1) * $perPage;

        // Count total
        $countSql = "SELECT COUNT(*) FROM {$this->table} a WHERE {$whereClause}";
        $total = (int) $this->db->fetchColumn($countSql, $params);

        // Fetch data
        $sql = "SELECT 
                    a.*,
                    c.name AS category_name,
                    b.name AS branch_name,
                    d.name AS department_name
                FROM {$this->table} a
                LEFT JOIN categories c ON a.category_id = c.id
                LEFT JOIN branches b ON a.branch_id = b.id
                LEFT JOIN departments d ON a.department_id = d.id
                WHERE {$whereClause}
                ORDER BY a.created_at DESC
                LIMIT ? OFFSET ?";

        $dataParams = array_merge($params, [$perPage, $offset]);
        $data = $this->db->fetchAll($sql, $dataParams);

        return ['data' => $data, 'total' => $total];
    }

    /**
     * Soft delete an asset
     */
    public function softDelete(string $assetCode): int
    {
        return $this->update($assetCode, [
            'is_deleted' => true,
            'deleted_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Restore a soft-deleted asset
     */
    public function restore(string $assetCode): int
    {
        return $this->update($assetCode, [
            'is_deleted' => false,
            'deleted_at' => null,
        ]);
    }

    /**
     * Count assets by status
     */
    public function countByStatus(): array
    {
        $sql = "SELECT status, COUNT(*) as count 
                FROM {$this->table} 
                WHERE is_deleted = false 
                GROUP BY status";
        return $this->db->fetchAll($sql);
    }

    /**
     * Count assets by category
     */
    public function countByCategory(): array
    {
        $sql = "SELECT c.name AS category, COUNT(a.asset_code) AS count
                FROM {$this->table} a
                JOIN categories c ON a.category_id = c.id
                WHERE a.is_deleted = false
                GROUP BY c.name
                ORDER BY count DESC";
        return $this->db->fetchAll($sql);
    }

    /**
     * Count assets by branch
     */
    public function countByBranch(): array
    {
        $sql = "SELECT b.name AS branch, b.code AS branch_code, COUNT(a.asset_code) AS count
                FROM {$this->table} a
                JOIN branches b ON a.branch_id = b.id
                WHERE a.is_deleted = false
                GROUP BY b.name, b.code
                ORDER BY count DESC";
        return $this->db->fetchAll($sql);
    }

    /**
     * Get assets with expiring warranties
     */
    public function getExpiringWarranties(int $days = 90): array
    {
        $sql = "SELECT 
                    a.asset_code, a.name, a.warranty_expiry,
                    b.name AS branch_name,
                    d.name AS department_name,
                    (a.warranty_expiry - CURRENT_DATE) AS days_remaining
                FROM {$this->table} a
                LEFT JOIN branches b ON a.branch_id = b.id
                LEFT JOIN departments d ON a.department_id = d.id
                WHERE a.is_deleted = false 
                AND a.warranty_expiry IS NOT NULL
                AND a.warranty_expiry <= CURRENT_DATE + INTERVAL '{$days} days'
                AND a.warranty_expiry >= CURRENT_DATE
                ORDER BY a.warranty_expiry ASC";
        return $this->db->fetchAll($sql);
    }

    /**
     * Count expiring warranties
     */
    public function countExpiringWarranties(int $days = 90): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} 
                WHERE is_deleted = false 
                AND warranty_expiry IS NOT NULL
                AND warranty_expiry <= CURRENT_DATE + INTERVAL '{$days} days'
                AND warranty_expiry >= CURRENT_DATE";
        return (int) $this->db->fetchColumn($sql);
    }

    /**
     * Get assets in transfer
     */
    public function getInTransfer(): array
    {
        $sql = "SELECT a.*, b.name AS branch_name, d.name AS department_name
                FROM {$this->table} a
                LEFT JOIN branches b ON a.branch_id = b.id
                LEFT JOIN departments d ON a.department_id = d.id
                WHERE a.status = 'in_transfer' AND a.is_deleted = false
                ORDER BY a.updated_at DESC";
        return $this->db->fetchAll($sql);
    }
}

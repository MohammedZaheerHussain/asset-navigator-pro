<?php

namespace App\Models;

class ServiceRecord extends Model
{
    protected $table = 'service_records';

    public function getAll(array $filters = []): array
    {
        $where = [];
        $params = [];

        if (!empty($filters['asset_code'])) {
            $where[] = "sr.asset_code = ?";
            $params[] = $filters['asset_code'];
        }
        if (!empty($filters['service_type'])) {
            $where[] = "sr.service_type = ?";
            $params[] = $filters['service_type'];
        }
        if (!empty($filters['search'])) {
            $where[] = "(sr.description ILIKE ? OR sr.vendor_name ILIKE ? OR sr.asset_code ILIKE ? OR a.name ILIKE ?)";
            $s = '%' . $filters['search'] . '%';
            $params = array_merge($params, [$s, $s, $s, $s]);
        }
        if (!empty($filters['date_from'])) {
            $where[] = "sr.service_date >= ?";
            $params[] = $filters['date_from'];
        }
        if (!empty($filters['date_to'])) {
            $where[] = "sr.service_date <= ?";
            $params[] = $filters['date_to'];
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT sr.*, u.full_name as logged_by_name, a.name as asset_name,
                       a.purchase_cost, a.purchase_date
                FROM {$this->table} sr
                LEFT JOIN users u ON sr.logged_by = u.id
                LEFT JOIN assets a ON sr.asset_code = a.asset_code
                {$whereClause}
                ORDER BY sr.service_date DESC, sr.created_at DESC";

        return $this->db->fetchAll($sql, $params);
    }

    public function getById(int $id): ?array
    {
        $sql = "SELECT sr.*, u.full_name as logged_by_name, a.name as asset_name,
                       a.purchase_cost, a.purchase_date
                FROM {$this->table} sr
                LEFT JOIN users u ON sr.logged_by = u.id
                LEFT JOIN assets a ON sr.asset_code = a.asset_code
                WHERE sr.id = ?";
        return $this->db->fetch($sql, [$id]);
    }

    public function getByAsset(string $assetCode): array
    {
        $sql = "SELECT sr.*, u.full_name as logged_by_name
                FROM {$this->table} sr
                LEFT JOIN users u ON sr.logged_by = u.id
                WHERE sr.asset_code = ?
                ORDER BY sr.service_date DESC";
        return $this->db->fetchAll($sql, [$assetCode]);
    }

    public function getAssetServiceSummary(string $assetCode): ?array
    {
        $sql = "SELECT 
                    COUNT(*) as total_services,
                    COALESCE(SUM(total_cost), 0) as total_service_cost,
                    COALESCE(SUM(labor_cost), 0) as total_labor_cost,
                    COALESCE(SUM(parts_cost), 0) as total_parts_cost,
                    MIN(service_date) as first_service,
                    MAX(service_date) as last_service
                FROM {$this->table}
                WHERE asset_code = ?";
        return $this->db->fetch($sql, [$assetCode]);
    }

    public function store(array $data): array
    {
        $sql = "INSERT INTO {$this->table} 
                    (asset_code, service_type, service_date, description, vendor_name,
                     labor_cost, parts_cost, parts_replaced, next_service_date,
                     document_id, performed_by, logged_by, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING *";

        return $this->db->fetch($sql, [
            $data['asset_code'],
            $data['service_type'] ?? 'corrective',
            $data['service_date'] ?? date('Y-m-d'),
            $data['description'],
            $data['vendor_name'] ?? null,
            $data['labor_cost'] ?? 0,
            $data['parts_cost'] ?? 0,
            $data['parts_replaced'] ?? null,
            $data['next_service_date'] ?? null,
            $data['document_id'] ?? null,
            $data['performed_by'] ?? null,
            $data['logged_by'] ?? null,
            $data['notes'] ?? null,
        ]);
    }

    public function update(int $id, array $data): ?array
    {
        $fields = [];
        $params = [];
        $allowed = ['service_type', 'service_date', 'description', 'vendor_name',
                     'labor_cost', 'parts_cost', 'parts_replaced', 'next_service_date',
                     'document_id', 'performed_by', 'notes'];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = ?";
                $params[] = $data[$field];
            }
        }
        if (empty($fields)) return $this->getById($id);

        $fields[] = "updated_at = NOW()";
        $params[] = $id;

        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = ? RETURNING *";
        return $this->db->fetch($sql, $params);
    }

    public function destroy(int $id): bool
    {
        return $this->db->query("DELETE FROM {$this->table} WHERE id = ?", [$id])->rowCount() > 0;
    }

    public function getDashboardStats(): array
    {
        $sql = "SELECT 
                    COUNT(*) as total_records,
                    COALESCE(SUM(total_cost), 0) as total_cost,
                    COUNT(DISTINCT asset_code) as assets_serviced,
                    COUNT(CASE WHEN service_type = 'preventive' THEN 1 END) as preventive_count,
                    COUNT(CASE WHEN service_type = 'corrective' THEN 1 END) as corrective_count,
                    COUNT(CASE WHEN service_type = 'calibration' THEN 1 END) as calibration_count
                FROM {$this->table}";
        return $this->db->fetch($sql);
    }
}

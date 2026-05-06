<?php

namespace App\Models;

class CondemnationRequest extends Model
{
    protected $table = 'condemnation_requests';

    public function getAll(array $filters = []): array
    {
        $where = [];
        $params = [];

        if (!empty($filters['status'])) {
            $where[] = "cr.status = ?";
            $params[] = $filters['status'];
        }
        if (!empty($filters['reason_category'])) {
            $where[] = "cr.reason_category = ?";
            $params[] = $filters['reason_category'];
        }
        if (!empty($filters['search'])) {
            $where[] = "(cr.asset_code ILIKE ? OR cr.reason ILIKE ? OR a.name ILIKE ?)";
            $s = '%' . $filters['search'] . '%';
            $params = array_merge($params, [$s, $s, $s]);
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT cr.*, 
                       a.name as asset_name, a.purchase_cost as asset_purchase_cost,
                       a.status as asset_status,
                       req.full_name as requested_by_name,
                       rev.full_name as reviewed_by_name
                FROM {$this->table} cr
                LEFT JOIN assets a ON cr.asset_code = a.asset_code
                LEFT JOIN users req ON cr.requested_by = req.id
                LEFT JOIN users rev ON cr.reviewed_by = rev.id
                {$whereClause}
                ORDER BY cr.created_at DESC";

        return $this->db->fetchAll($sql, $params);
    }

    public function getById(int $id): ?array
    {
        $sql = "SELECT cr.*, 
                       a.name as asset_name, a.purchase_cost as asset_purchase_cost,
                       a.status as asset_status,
                       req.full_name as requested_by_name,
                       rev.full_name as reviewed_by_name
                FROM {$this->table} cr
                LEFT JOIN assets a ON cr.asset_code = a.asset_code
                LEFT JOIN users req ON cr.requested_by = req.id
                LEFT JOIN users rev ON cr.reviewed_by = rev.id
                WHERE cr.id = ?";
        return $this->db->fetch($sql, [$id]);
    }

    public function store(array $data): array
    {
        $sql = "INSERT INTO {$this->table} 
                    (asset_code, reason, reason_category, purchase_cost, current_book_value,
                     total_service_cost, service_cost_ratio, requested_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING *";

        return $this->db->fetch($sql, [
            $data['asset_code'],
            $data['reason'],
            $data['reason_category'] ?? 'beyond_repair',
            $data['purchase_cost'] ?? null,
            $data['current_book_value'] ?? null,
            $data['total_service_cost'] ?? null,
            $data['service_cost_ratio'] ?? null,
            $data['requested_by'],
        ]);
    }

    public function review(int $id, array $data): ?array
    {
        $sql = "UPDATE {$this->table} SET
                    status = ?,
                    reviewed_by = ?,
                    review_date = NOW(),
                    review_comments = ?,
                    updated_at = NOW()
                WHERE id = ? RETURNING *";

        return $this->db->fetch($sql, [
            $data['status'],
            $data['reviewed_by'],
            $data['review_comments'] ?? null,
            $id,
        ]);
    }

    public function getPendingCount(): int
    {
        $sql = "SELECT COUNT(*) as cnt FROM {$this->table} WHERE status = 'pending'";
        $row = $this->db->fetch($sql);
        return (int)($row['cnt'] ?? 0);
    }
}

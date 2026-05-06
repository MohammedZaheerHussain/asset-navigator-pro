<?php

namespace App\Models;

class AssetDisposal extends Model
{
    protected $table = 'asset_disposals';

    public function getAll(array $filters = []): array
    {
        $where = [];
        $params = [];

        if (!empty($filters['disposal_method'])) {
            $where[] = "ad.disposal_method = ?";
            $params[] = $filters['disposal_method'];
        }
        if (!empty($filters['search'])) {
            $where[] = "(ad.asset_code ILIKE ? OR a.name ILIKE ? OR ad.buyer_recipient ILIKE ?)";
            $s = '%' . $filters['search'] . '%';
            $params = array_merge($params, [$s, $s, $s]);
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT ad.*, 
                       a.name as asset_name, a.purchase_cost,
                       cr.reason, cr.reason_category,
                       u.full_name as disposed_by_name
                FROM {$this->table} ad
                LEFT JOIN assets a ON ad.asset_code = a.asset_code
                LEFT JOIN condemnation_requests cr ON ad.condemnation_id = cr.id
                LEFT JOIN users u ON ad.disposed_by = u.id
                {$whereClause}
                ORDER BY ad.disposal_date DESC";

        return $this->db->fetchAll($sql, $params);
    }

    public function getById(int $id): ?array
    {
        $sql = "SELECT ad.*, 
                       a.name as asset_name, a.purchase_cost,
                       cr.reason, cr.reason_category, cr.current_book_value, cr.total_service_cost,
                       u.full_name as disposed_by_name
                FROM {$this->table} ad
                LEFT JOIN assets a ON ad.asset_code = a.asset_code
                LEFT JOIN condemnation_requests cr ON ad.condemnation_id = cr.id
                LEFT JOIN users u ON ad.disposed_by = u.id
                WHERE ad.id = ?";
        return $this->db->fetch($sql, [$id]);
    }

    public function store(array $data): array
    {
        $sql = "INSERT INTO {$this->table} 
                    (asset_code, condemnation_id, disposal_method, disposal_date,
                     amount_recovered, buyer_recipient, certificate_number, disposal_notes, disposed_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING *";

        return $this->db->fetch($sql, [
            $data['asset_code'],
            $data['condemnation_id'],
            $data['disposal_method'] ?? 'scrap',
            $data['disposal_date'] ?? date('Y-m-d'),
            $data['amount_recovered'] ?? 0,
            $data['buyer_recipient'] ?? null,
            $data['certificate_number'] ?? null,
            $data['disposal_notes'] ?? null,
            $data['disposed_by'],
        ]);
    }

    public function getStats(): array
    {
        $sql = "SELECT 
                    COUNT(*) as total_disposals,
                    COALESCE(SUM(amount_recovered), 0) as total_recovered,
                    disposal_method, COUNT(*) as method_count
                FROM {$this->table}
                GROUP BY disposal_method";
        return $this->db->fetchAll($sql);
    }
}

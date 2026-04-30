<?php

namespace App\Models;

/**
 * Transfer Model
 * 
 * Tracks asset transfers between branches and departments.
 */
class Transfer extends Model
{
    protected $table = 'transfers';
    protected $primaryKey = 'id';

    /**
     * Get transfer with full details
     */
    public function findWithDetails(int $id): ?array
    {
        $sql = "SELECT 
                    t.*,
                    a.name AS asset_name,
                    fb.name AS from_branch_name,
                    fd.name AS from_department_name,
                    tb.name AS to_branch_name,
                    td.name AS to_department_name,
                    ui.full_name AS initiated_by_name,
                    uc.full_name AS completed_by_name
                FROM {$this->table} t
                LEFT JOIN assets a ON t.asset_code = a.asset_code
                LEFT JOIN branches fb ON t.from_branch_id = fb.id
                LEFT JOIN departments fd ON t.from_department_id = fd.id
                LEFT JOIN branches tb ON t.to_branch_id = tb.id
                LEFT JOIN departments td ON t.to_department_id = td.id
                LEFT JOIN users ui ON t.initiated_by = ui.id
                LEFT JOIN users uc ON t.completed_by = uc.id
                WHERE t.id = ?";
        return $this->db->fetch($sql, [$id]);
    }

    /**
     * Get paginated transfers
     */
    public function getPaginated(array $filters = [], int $page = 1, int $perPage = 20): array
    {
        $where = ['1=1'];
        $params = [];

        if (!empty($filters['status'])) {
            $where[] = 't.status = ?';
            $params[] = $filters['status'];
        }
        if (!empty($filters['asset_code'])) {
            $where[] = 't.asset_code = ?';
            $params[] = $filters['asset_code'];
        }

        $whereClause = implode(' AND ', $where);
        $offset = ($page - 1) * $perPage;

        $countSql = "SELECT COUNT(*) FROM {$this->table} t WHERE {$whereClause}";
        $total = (int) $this->db->fetchColumn($countSql, $params);

        $sql = "SELECT 
                    t.*,
                    a.name AS asset_name,
                    fb.name AS from_branch_name,
                    tb.name AS to_branch_name
                FROM {$this->table} t
                LEFT JOIN assets a ON t.asset_code = a.asset_code
                LEFT JOIN branches fb ON t.from_branch_id = fb.id
                LEFT JOIN branches tb ON t.to_branch_id = tb.id
                WHERE {$whereClause}
                ORDER BY t.created_at DESC
                LIMIT ? OFFSET ?";

        $data = $this->db->fetchAll($sql, array_merge($params, [$perPage, $offset]));

        return ['data' => $data, 'total' => $total];
    }

    /**
     * Get transfer history for a specific asset
     */
    public function getAssetHistory(string $assetCode): array
    {
        $sql = "SELECT 
                    t.*,
                    fb.name AS from_branch_name,
                    fd.name AS from_department_name,
                    tb.name AS to_branch_name,
                    td.name AS to_department_name,
                    ui.full_name AS initiated_by_name,
                    uc.full_name AS completed_by_name
                FROM {$this->table} t
                LEFT JOIN branches fb ON t.from_branch_id = fb.id
                LEFT JOIN departments fd ON t.from_department_id = fd.id
                LEFT JOIN branches tb ON t.to_branch_id = tb.id
                LEFT JOIN departments td ON t.to_department_id = td.id
                LEFT JOIN users ui ON t.initiated_by = ui.id
                LEFT JOIN users uc ON t.completed_by = uc.id
                WHERE t.asset_code = ?
                ORDER BY t.created_at DESC";
        return $this->db->fetchAll($sql, [$assetCode]);
    }

    /**
     * Count active transfers
     */
    public function countActive(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE status IN ('pending', 'in_transit')";
        return (int) $this->db->fetchColumn($sql);
    }
}

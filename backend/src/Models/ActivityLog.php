<?php

namespace App\Models;

/**
 * Activity Log Model
 * 
 * Tracks all actions performed on assets for audit trail.
 */
class ActivityLog extends Model
{
    protected $table = 'activity_logs';
    protected $primaryKey = 'id';

    /**
     * Log an activity
     */
    public function log(string $assetCode, string $action, ?int $userId = null, ?array $details = null, ?string $ip = null): string
    {
        $data = [
            'asset_code'   => $assetCode,
            'action'       => $action,
            'performed_by' => $userId,
            'details'      => $details ? json_encode($details) : null,
            'ip_address'   => $ip,
        ];

        return $this->create($data);
    }

    /**
     * Get recent activity with details
     */
    public function getRecent(int $limit = 20): array
    {
        $sql = "SELECT 
                    al.*,
                    a.name AS asset_name,
                    u.full_name AS performed_by_name
                FROM {$this->table} al
                LEFT JOIN assets a ON al.asset_code = a.asset_code
                LEFT JOIN users u ON al.performed_by = u.id
                ORDER BY al.created_at DESC
                LIMIT ?";
        return $this->db->fetchAll($sql, [$limit]);
    }

    /**
     * Get activity for a specific asset
     */
    public function getByAsset(string $assetCode): array
    {
        $sql = "SELECT 
                    al.*,
                    u.full_name AS performed_by_name
                FROM {$this->table} al
                LEFT JOIN users u ON al.performed_by = u.id
                WHERE al.asset_code = ?
                ORDER BY al.created_at DESC";
        return $this->db->fetchAll($sql, [$assetCode]);
    }

    /**
     * Get paginated activity logs
     */
    public function getPaginated(array $filters = [], int $page = 1, int $perPage = 50): array
    {
        $where = ['1=1'];
        $params = [];

        if (!empty($filters['asset_code'])) {
            $where[] = 'al.asset_code = ?';
            $params[] = $filters['asset_code'];
        }
        if (!empty($filters['action'])) {
            $where[] = 'al.action = ?';
            $params[] = $filters['action'];
        }
        if (!empty($filters['performed_by'])) {
            $where[] = 'al.performed_by = ?';
            $params[] = $filters['performed_by'];
        }

        $whereClause = implode(' AND ', $where);
        $offset = ($page - 1) * $perPage;

        $countSql = "SELECT COUNT(*) FROM {$this->table} al WHERE {$whereClause}";
        $total = (int) $this->db->fetchColumn($countSql, $params);

        $sql = "SELECT 
                    al.*,
                    a.name AS asset_name,
                    u.full_name AS performed_by_name
                FROM {$this->table} al
                LEFT JOIN assets a ON al.asset_code = a.asset_code
                LEFT JOIN users u ON al.performed_by = u.id
                WHERE {$whereClause}
                ORDER BY al.created_at DESC
                LIMIT ? OFFSET ?";

        $data = $this->db->fetchAll($sql, array_merge($params, [$perPage, $offset]));

        return ['data' => $data, 'total' => $total];
    }
}

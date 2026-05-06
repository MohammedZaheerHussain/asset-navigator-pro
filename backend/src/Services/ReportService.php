<?php

namespace App\Services;

use App\Core\Database;

/**
 * ReportService — Multi-User Report Management with Audit Trail
 *
 * Handles CRUD operations on reports with:
 * - Optimistic locking (updated_at timestamp check)
 * - Full audit trail (report_updates table)
 * - Branch/role-based filtering
 */
class ReportService
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── List Reports (with filters + pagination) ────────────
    public function list(array $filters, int $page, int $perPage): array
    {
        $where = ["r.status != 'archived'"];
        $params = [];

        if (!empty($filters['report_type'])) {
            $where[] = "r.report_type = ?";
            $params[] = $filters['report_type'];
        }
        if (!empty($filters['branch_id'])) {
            $where[] = "r.branch_id = ?";
            $params[] = (int)$filters['branch_id'];
        }
        if (!empty($filters['department_id'])) {
            $where[] = "r.department_id = ?";
            $params[] = (int)$filters['department_id'];
        }
        if (!empty($filters['status'])) {
            array_shift($where);
            $where[] = "r.status = ?";
            $params[] = $filters['status'];
        }
        if (!empty($filters['search'])) {
            $where[] = "(r.title ILIKE ? OR r.remarks ILIKE ?)";
            $params[] = '%' . $filters['search'] . '%';
            $params[] = '%' . $filters['search'] . '%';
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        // Count
        $countSql = "SELECT COUNT(*) FROM reports r $whereClause";
        $countResult = $this->db->fetch($countSql, $params);
        $total = (int)($countResult['count'] ?? 0);

        // Data
        $offset = ($page - 1) * $perPage;
        $dataSql = "
            SELECT r.*,
                   b.name AS branch_name,
                   d.name AS department_name,
                   u.full_name AS updated_by_name,
                   cu.full_name AS created_by_name
            FROM reports r
            LEFT JOIN branches b ON r.branch_id = b.id
            LEFT JOIN departments d ON r.department_id = d.id
            LEFT JOIN users u ON r.last_updated_by = u.id
            LEFT JOIN users cu ON r.created_by = cu.id
            $whereClause
            ORDER BY r.updated_at DESC
            LIMIT $perPage OFFSET $offset
        ";

        $data = $this->db->fetchAll($dataSql, $params);

        return ['data' => $data, 'total' => $total];
    }

    // ─── Get Single Report ───────────────────────────────────
    public function getById(int $id): ?array
    {
        $sql = "
            SELECT r.*,
                   b.name AS branch_name, b.code AS branch_code,
                   d.name AS department_name,
                   u.full_name AS updated_by_name,
                   cu.full_name AS created_by_name
            FROM reports r
            LEFT JOIN branches b ON r.branch_id = b.id
            LEFT JOIN departments d ON r.department_id = d.id
            LEFT JOIN users u ON r.last_updated_by = u.id
            LEFT JOIN users cu ON r.created_by = cu.id
            WHERE r.id = ?
        ";
        return $this->db->fetch($sql, [$id]);
    }

    // ─── Create Report ───────────────────────────────────────
    public function create(array $data, ?int $userId, ?string $ip): array
    {
        $errors = $this->validate($data);
        if (!empty($errors)) {
            return ['success' => false, 'errors' => $errors];
        }

        $sql = "
            INSERT INTO reports (report_type, title, branch_id, department_id, total_quantity, unit, remarks, status, created_by, last_updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
        ";
        $params = [
            $data['report_type'],
            trim($data['title']),
            (int)$data['branch_id'],
            (int)$data['department_id'],
            (float)$data['total_quantity'],
            $data['unit'] ?? 'units',
            $data['remarks'] ?? null,
            $data['status'] ?? 'active',
            $userId,
            $userId,
        ];

        $report = $this->db->fetch($sql, $params);

        // Audit trail
        $this->logChange($report['id'], $userId, 'create', null, [
            'title'          => $report['title'],
            'report_type'    => $report['report_type'],
            'total_quantity' => $report['total_quantity'],
            'unit'           => $report['unit'],
            'remarks'        => $report['remarks'],
        ], 'Report created', $ip);

        return ['success' => true, 'data' => $report];
    }

    // ─── Update Report (with Optimistic Locking) ─────────────
    public function update(int $id, array $data, ?int $userId, ?string $ip): array
    {
        $current = $this->getById($id);
        if (!$current) {
            return ['success' => false, 'message' => 'Report not found'];
        }

        // Optimistic locking
        if (!empty($data['expected_updated_at'])) {
            if ($data['expected_updated_at'] !== $current['updated_at']) {
                return [
                    'success' => false,
                    'message' => 'Conflict: This report was modified by another user. Please refresh and try again.',
                    'conflict' => true,
                    'current_data' => $current,
                ];
            }
        }

        $errors = $this->validate($data, true);
        if (!empty($errors)) {
            return ['success' => false, 'errors' => $errors];
        }

        $previousValue = [
            'title'          => $current['title'],
            'total_quantity' => $current['total_quantity'],
            'unit'           => $current['unit'],
            'remarks'        => $current['remarks'],
        ];

        $sql = "
            UPDATE reports
            SET title           = COALESCE(?, title),
                total_quantity  = COALESCE(?, total_quantity),
                unit            = COALESCE(?, unit),
                remarks         = ?,
                last_updated_by = ?,
                updated_at      = CURRENT_TIMESTAMP
            WHERE id = ?
            RETURNING *
        ";
        $params = [
            isset($data['title']) ? trim($data['title']) : null,
            isset($data['total_quantity']) ? (float)$data['total_quantity'] : null,
            $data['unit'] ?? null,
            array_key_exists('remarks', $data) ? $data['remarks'] : $current['remarks'],
            $userId,
            $id,
        ];

        $updated = $this->db->fetch($sql, $params);

        $newValue = [
            'title'          => $updated['title'],
            'total_quantity' => $updated['total_quantity'],
            'unit'           => $updated['unit'],
            'remarks'        => $updated['remarks'],
        ];

        $changes = [];
        if ($previousValue['total_quantity'] != $newValue['total_quantity']) {
            $changes[] = "Quantity: {$previousValue['total_quantity']} → {$newValue['total_quantity']}";
        }
        if ($previousValue['unit'] !== $newValue['unit']) {
            $changes[] = "Unit: {$previousValue['unit']} → {$newValue['unit']}";
        }
        if ($previousValue['title'] !== $newValue['title']) {
            $changes[] = "Title updated";
        }
        if ($previousValue['remarks'] !== $newValue['remarks']) {
            $changes[] = "Remarks updated";
        }
        $summary = $changes ? implode(', ', $changes) : 'No changes';

        $this->logChange($id, $userId, 'update', $previousValue, $newValue, $summary, $ip);

        return ['success' => true, 'data' => $this->getById($id)];
    }

    // ─── Archive (Soft Delete) ───────────────────────────────
    public function archive(int $id, ?int $userId, ?string $ip): array
    {
        $current = $this->getById($id);
        if (!$current) {
            return ['success' => false, 'message' => 'Report not found'];
        }

        $sql = "UPDATE reports SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        $this->db->query($sql, [$id]);

        $this->logChange($id, $userId, 'archive', ['status' => $current['status']], ['status' => 'archived'], 'Report archived', $ip);

        return ['success' => true, 'message' => 'Report archived'];
    }

    // ─── Get Update History ──────────────────────────────────
    public function getHistory(int $reportId, int $limit = 50): array
    {
        $sql = "
            SELECT ru.*,
                   u.full_name AS user_name,
                   u.role AS user_role
            FROM report_updates ru
            LEFT JOIN users u ON ru.updated_by = u.id
            WHERE ru.report_id = ?
            ORDER BY ru.created_at DESC
            LIMIT ?
        ";
        return $this->db->fetchAll($sql, [$reportId, $limit]);
    }

    // ─── Private: Audit Logger ───────────────────────────────
    private function logChange(int $reportId, ?int $userId, string $changeType, ?array $prev, array $new, string $summary, ?string $ip): void
    {
        $sql = "
            INSERT INTO report_updates (report_id, updated_by, change_type, previous_value, new_value, change_summary, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ";
        $this->db->query($sql, [
            $reportId,
            $userId,
            $changeType,
            $prev ? json_encode($prev) : null,
            json_encode($new),
            $summary,
            $ip,
        ]);
    }

    // ─── Private: Validation ─────────────────────────────────
    private function validate(array $data, bool $isUpdate = false): array
    {
        $errors = [];

        if (!$isUpdate) {
            if (empty($data['report_type']) || !in_array($data['report_type'], ['material', 'acid', 'other'])) {
                $errors[] = 'report_type must be material, acid, or other';
            }
            if (empty($data['title'])) {
                $errors[] = 'title is required';
            }
            if (empty($data['branch_id'])) {
                $errors[] = 'branch_id is required';
            }
            if (empty($data['department_id'])) {
                $errors[] = 'department_id is required';
            }
        }

        if (isset($data['total_quantity']) && !is_numeric($data['total_quantity'])) {
            $errors[] = 'total_quantity must be a number';
        }
        if (isset($data['total_quantity']) && (float)$data['total_quantity'] < 0) {
            $errors[] = 'total_quantity cannot be negative';
        }
        if (isset($data['unit']) && !in_array($data['unit'], ['kg', 'liters', 'units', 'pieces', 'meters', 'bottles', 'packets', 'boxes'])) {
            $errors[] = 'Invalid unit value';
        }

        return $errors;
    }
}

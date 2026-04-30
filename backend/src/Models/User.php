<?php

namespace App\Models;

/**
 * User Model
 * 
 * Enhanced with full CRUD, pagination, role checks, and soft-delete support.
 */
class User extends Model
{
    protected $table = 'users';
    protected $primaryKey = 'id';

    // Fields safe for API responses (never includes password_hash)
    private $safeFields = 'id, username, email, full_name, phone, role, is_active, last_login, created_at, updated_at';

    /**
     * Find user by username
     */
    public function findByUsername(string $username): ?array
    {
        return $this->findOneBy('username', $username);
    }

    /**
     * Find user by email
     */
    public function findByEmail(string $email): ?array
    {
        return $this->findOneBy('email', $email);
    }

    /**
     * Get user without password hash (safe for API response)
     */
    public function findSafe(int $id): ?array
    {
        $sql = "SELECT {$this->safeFields} FROM {$this->table} WHERE id = ?";
        return $this->db->fetch($sql, [$id]);
    }

    /**
     * Get all users with pagination and filtering
     */
    public function getAllPaginated(int $page = 1, int $perPage = 20, array $filters = []): array
    {
        $where = [];
        $params = [];

        // Filter by role
        if (!empty($filters['role'])) {
            $where[] = "role = ?";
            $params[] = $filters['role'];
        }

        // Filter by status (active/inactive)
        if (isset($filters['status'])) {
            $isActive = $filters['status'] === 'active' ? true : false;
            $where[] = "is_active = ?";
            $params[] = $isActive ? 'true' : 'false';
        }

        // Search by name, username, or email
        if (!empty($filters['search'])) {
            $where[] = "(username ILIKE ? OR email ILIKE ? OR full_name ILIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // Get total count
        $countSql = "SELECT COUNT(*) FROM {$this->table} {$whereClause}";
        $total = (int) $this->db->fetchColumn($countSql, $params);

        // Get paginated data
        $offset = ($page - 1) * $perPage;
        $dataSql = "SELECT {$this->safeFields} FROM {$this->table} {$whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $dataParams = array_merge($params, [$perPage, $offset]);
        $users = $this->db->fetchAll($dataSql, $dataParams);

        return [
            'data' => $users,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
        ];
    }

    /**
     * Get all active users (for dropdowns)
     */
    public function getActiveUsers(): array
    {
        $sql = "SELECT id, username, email, full_name, role, last_login, created_at 
                FROM {$this->table} 
                WHERE is_active = true 
                ORDER BY full_name";
        return $this->db->fetchAll($sql);
    }

    /**
     * Update last login timestamp
     */
    public function updateLastLogin(int $id): void
    {
        $this->update($id, ['last_login' => date('Y-m-d H:i:s')]);
    }

    /**
     * Soft-delete: deactivate user
     */
    public function deactivate(int $id): int
    {
        return $this->update($id, ['is_active' => false]);
    }

    /**
     * Reactivate user
     */
    public function activate(int $id): int
    {
        return $this->update($id, ['is_active' => true]);
    }

    /**
     * Check if username exists (excluding a specific user ID for updates)
     */
    public function usernameExists(string $username, ?int $excludeId = null): bool
    {
        $sql = "SELECT 1 FROM {$this->table} WHERE username = ?";
        $params = [$username];
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        return $this->db->fetch($sql, $params) !== null;
    }

    /**
     * Check if email exists (excluding a specific user ID for updates)
     */
    public function emailExists(string $email, ?int $excludeId = null): bool
    {
        $sql = "SELECT 1 FROM {$this->table} WHERE email = ?";
        $params = [$email];
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        return $this->db->fetch($sql, $params) !== null;
    }

    /**
     * Get user count by role
     */
    public function countByRole(): array
    {
        $sql = "SELECT role, COUNT(*) as count FROM {$this->table} GROUP BY role";
        return $this->db->fetchAll($sql);
    }
}

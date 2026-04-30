<?php

namespace App\Models;

/**
 * Department Model
 */
class Department extends Model
{
    protected $table = 'departments';
    protected $primaryKey = 'id';

    /**
     * Get all active departments
     */
    public function getActive(): array
    {
        $sql = "SELECT d.*, b.name AS branch_name, b.code AS branch_code
                FROM {$this->table} d
                LEFT JOIN branches b ON d.branch_id = b.id
                WHERE d.is_active = true
                ORDER BY b.name, d.name";
        return $this->db->fetchAll($sql);
    }

    /**
     * Get departments by branch
     */
    public function getByBranch(int $branchId): array
    {
        $sql = "SELECT d.*, b.name AS branch_name
                FROM {$this->table} d
                LEFT JOIN branches b ON d.branch_id = b.id
                WHERE d.branch_id = ? AND d.is_active = true
                ORDER BY d.name";
        return $this->db->fetchAll($sql, [$branchId]);
    }

    /**
     * Find department by code
     */
    public function findByCode(string $code): ?array
    {
        return $this->findOneBy('code', $code);
    }
}

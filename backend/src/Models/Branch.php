<?php

namespace App\Models;

/**
 * Branch Model
 */
class Branch extends Model
{
    protected $table = 'branches';
    protected $primaryKey = 'id';

    /**
     * Get all active branches
     */
    public function getActive(): array
    {
        return $this->all(['is_active' => true], 'name ASC');
    }

    /**
     * Find branch by code
     */
    public function findByCode(string $code): ?array
    {
        return $this->findOneBy('code', $code);
    }

    /**
     * Get branch with department count
     */
    public function getWithDepartmentCount(): array
    {
        $sql = "SELECT b.*, COUNT(d.id) AS department_count
                FROM {$this->table} b
                LEFT JOIN departments d ON b.id = d.branch_id AND d.is_active = true
                WHERE b.is_active = true
                GROUP BY b.id
                ORDER BY b.name";
        return $this->db->fetchAll($sql);
    }
}

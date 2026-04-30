<?php

namespace App\Models;

use App\Core\Database;

/**
 * Base Model
 * 
 * Provides common database operations for all models.
 * All models extend this class and define their table and primary key.
 */
abstract class Model
{
    /** @var string Table name */
    protected $table;

    /** @var string Primary key column */
    protected $primaryKey = 'id';

    /** @var Database */
    protected $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Find a record by its primary key
     */
    public function find($id): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ?";
        return $this->db->fetch($sql, [$id]);
    }

    /**
     * Get all records with optional conditions
     */
    public function all(array $conditions = [], string $orderBy = '', int $limit = 0, int $offset = 0): array
    {
        $sql = "SELECT * FROM {$this->table}";
        $params = [];

        if (!empty($conditions)) {
            $whereClauses = [];
            foreach ($conditions as $column => $value) {
                if ($value === null) {
                    $whereClauses[] = "{$column} IS NULL";
                } else {
                    $whereClauses[] = "{$column} = ?";
                    $params[] = $value;
                }
            }
            $sql .= ' WHERE ' . implode(' AND ', $whereClauses);
        }

        if ($orderBy) {
            $sql .= " ORDER BY {$orderBy}";
        }

        if ($limit > 0) {
            $sql .= " LIMIT ?";
            $params[] = $limit;
            if ($offset > 0) {
                $sql .= " OFFSET ?";
                $params[] = $offset;
            }
        }

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Count records with optional conditions
     */
    public function count(array $conditions = []): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table}";
        $params = [];

        if (!empty($conditions)) {
            $whereClauses = [];
            foreach ($conditions as $column => $value) {
                if ($value === null) {
                    $whereClauses[] = "{$column} IS NULL";
                } else {
                    $whereClauses[] = "{$column} = ?";
                    $params[] = $value;
                }
            }
            $sql .= ' WHERE ' . implode(' AND ', $whereClauses);
        }

        return (int) $this->db->fetchColumn($sql, $params);
    }

    /**
     * Create a new record
     */
    public function create(array $data): string
    {
        return $this->db->insert($this->table, $data);
    }

    /**
     * Update a record by primary key
     */
    public function update($id, array $data): int
    {
        return $this->db->update(
            $this->table,
            $data,
            "{$this->primaryKey} = ?",
            [$id]
        );
    }

    /**
     * Delete a record by primary key
     */
    public function delete($id): int
    {
        $sql = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = ?";
        return $this->db->query($sql, [$id])->rowCount();
    }

    /**
     * Find records by a specific column
     */
    public function findBy(string $column, $value): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE {$column} = ?";
        return $this->db->fetchAll($sql, [$value]);
    }

    /**
     * Find a single record by a specific column
     */
    public function findOneBy(string $column, $value): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE {$column} = ? LIMIT 1";
        return $this->db->fetch($sql, [$value]);
    }

    /**
     * Check if a record exists
     */
    public function exists(string $column, $value): bool
    {
        $sql = "SELECT 1 FROM {$this->table} WHERE {$column} = ? LIMIT 1";
        return $this->db->fetch($sql, [$value]) !== null;
    }

    /**
     * Get the database instance
     */
    protected function getDb(): Database
    {
        return $this->db;
    }
}

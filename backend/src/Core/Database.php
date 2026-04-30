<?php

namespace App\Core;

/**
 * Database Connection Manager (Singleton)
 * 
 * Handles PDO connection lifecycle with support for PostgreSQL and MySQL.
 * Uses prepared statements exclusively to prevent SQL injection.
 */
class Database
{
    /** @var Database|null */
    private static $instance = null;

    /** @var \PDO */
    private $pdo;

    /** @var array */
    private $config;

    /**
     * Private constructor (Singleton pattern)
     */
    private function __construct()
    {
        $this->config = require __DIR__ . '/../../config/database.php';
        $this->connect();
    }

    /**
     * Get singleton instance
     */
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Establish PDO connection
     */
    private function connect(): void
    {
        $driver = $this->config['driver'];
        $host = $this->config['host'];
        $port = $this->config['port'];
        $database = $this->config['database'];
        $username = $this->config['username'];
        $password = $this->config['password'];
        $charset = $this->config['charset'];

        if ($driver === 'pgsql') {
            $dsn = "pgsql:host={$host};port={$port};dbname={$database}";
        } else {
            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset={$charset}";
        }

        try {
            $this->pdo = new \PDO($dsn, $username, $password, $this->config['options']);
        } catch (\PDOException $e) {
            Response::error('Database connection failed: ' . $e->getMessage(), 500);
            exit;
        }
    }

    /**
     * Get the PDO instance
     */
    public function getConnection(): \PDO
    {
        return $this->pdo;
    }

    /**
     * Execute a query with optional parameters
     */
    public function query(string $sql, array $params = []): \PDOStatement
    {
        $stmt = $this->pdo->prepare($sql);

        // Bind parameters with proper types for PostgreSQL compatibility
        foreach ($params as $index => $value) {
            $paramIndex = $index + 1; // PDO is 1-indexed
            if (is_bool($value)) {
                $stmt->bindValue($paramIndex, $value, \PDO::PARAM_BOOL);
            } elseif (is_null($value)) {
                $stmt->bindValue($paramIndex, null, \PDO::PARAM_NULL);
            } elseif (is_int($value)) {
                $stmt->bindValue($paramIndex, $value, \PDO::PARAM_INT);
            } else {
                $stmt->bindValue($paramIndex, $value, \PDO::PARAM_STR);
            }
        }

        $stmt->execute();
        return $stmt;
    }

    /**
     * Fetch all rows
     */
    public function fetchAll(string $sql, array $params = []): array
    {
        return $this->query($sql, $params)->fetchAll();
    }

    /**
     * Fetch a single row
     */
    public function fetch(string $sql, array $params = []): ?array
    {
        $result = $this->query($sql, $params)->fetch();
        return $result ?: null;
    }

    /**
     * Fetch a single column value
     */
    public function fetchColumn(string $sql, array $params = [])
    {
        return $this->query($sql, $params)->fetchColumn();
    }

    /**
     * Insert a row and return the last inserted ID
     */
    public function insert(string $table, array $data): string
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));

        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        $this->query($sql, array_values($data));

        return $this->pdo->lastInsertId();
    }

    /**
     * Update rows in a table
     */
    public function update(string $table, array $data, string $where, array $whereParams = []): int
    {
        $setClauses = [];
        $values = [];
        foreach ($data as $column => $value) {
            $setClauses[] = "{$column} = ?";
            $values[] = $value;
        }

        $sql = "UPDATE {$table} SET " . implode(', ', $setClauses) . " WHERE {$where}";
        $params = array_merge($values, $whereParams);

        return $this->query($sql, $params)->rowCount();
    }

    /**
     * Begin a transaction
     */
    public function beginTransaction(): bool
    {
        return $this->pdo->beginTransaction();
    }

    /**
     * Commit a transaction
     */
    public function commit(): bool
    {
        return $this->pdo->commit();
    }

    /**
     * Rollback a transaction
     */
    public function rollback(): bool
    {
        return $this->pdo->rollBack();
    }

    /**
     * Prevent cloning (Singleton)
     */
    private function __clone() {}
}

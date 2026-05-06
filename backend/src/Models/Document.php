<?php

namespace App\Models;

class Document extends Model
{
    protected $table = 'documents';

    /**
     * Get all documents with optional filters (excludes file_data for listing)
     */
    public function getAll(array $filters = []): array
    {
        $where = [];
        $params = [];
        $i = 0;

        if (!empty($filters['document_type'])) {
            $where[] = "d.document_type = ?";
            $params[] = $filters['document_type'];
        }
        if (!empty($filters['asset_code'])) {
            $where[] = "d.asset_code = ?";
            $params[] = $filters['asset_code'];
        }
        if (!empty($filters['search'])) {
            $where[] = "(d.title ILIKE ? OR d.original_filename ILIKE ? OR d.asset_code ILIKE ?)";
            $s = '%' . $filters['search'] . '%';
            $params[] = $s;
            $params[] = $s;
            $params[] = $s;
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT d.id, d.asset_code, d.document_type, d.title, d.original_filename,
                       d.mime_type, d.file_size, d.notes, d.uploaded_by, d.created_at, d.updated_at,
                       u.full_name as uploader_name,
                       a.name as asset_name
                FROM {$this->table} d
                LEFT JOIN users u ON d.uploaded_by = u.id
                LEFT JOIN assets a ON d.asset_code = a.asset_code
                {$whereClause}
                ORDER BY d.created_at DESC";

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Get single document metadata (no file_data)
     */
    public function getMeta(int $id): ?array
    {
        $sql = "SELECT id, asset_code, document_type, title, original_filename,
                       mime_type, file_size, notes, uploaded_by, created_at, updated_at
                FROM {$this->table} WHERE id = ?";
        return $this->db->fetch($sql, [$id]);
    }

    /**
     * Get single document WITH file data (for download)
     */
    public function getWithData(int $id): ?array
    {
        $pdo = $this->db->getConnection();
        $stmt = $pdo->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Store a new document (uses raw PDO for bytea binding)
     */
    public function store(array $data): array
    {
        $pdo = $this->db->getConnection();
        $stmt = $pdo->prepare(
            "INSERT INTO {$this->table} 
                (asset_code, document_type, title, original_filename, mime_type, file_size, file_data, notes, uploaded_by)
             VALUES 
                (:asset_code, :document_type, :title, :original_filename, :mime_type, :file_size, :file_data, :notes, :uploaded_by)
             RETURNING id, asset_code, document_type, title, original_filename, mime_type, file_size, notes, uploaded_by, created_at"
        );

        $stmt->bindValue(':asset_code', $data['asset_code']);
        $stmt->bindValue(':document_type', $data['document_type']);
        $stmt->bindValue(':title', $data['title']);
        $stmt->bindValue(':original_filename', $data['original_filename']);
        $stmt->bindValue(':mime_type', $data['mime_type']);
        $stmt->bindValue(':file_size', $data['file_size'], \PDO::PARAM_INT);
        $stmt->bindValue(':file_data', $data['file_data'], \PDO::PARAM_LOB);
        $stmt->bindValue(':notes', $data['notes'] ?? null);
        $stmt->bindValue(':uploaded_by', $data['uploaded_by'], \PDO::PARAM_INT);

        $stmt->execute();
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * Delete a document
     */
    public function destroy(int $id): bool
    {
        $sql = "DELETE FROM {$this->table} WHERE id = ?";
        return $this->db->query($sql, [$id])->rowCount() > 0;
    }

    /**
     * Get document counts grouped by type
     */
    public function getStats(): array
    {
        $sql = "SELECT document_type, COUNT(*) as count, SUM(file_size) as total_size
                FROM {$this->table} GROUP BY document_type";
        return $this->db->fetchAll($sql);
    }
}

<?php

namespace App\Models;

class Supplier extends Model
{
    protected $table = 'suppliers';

    public function list(array $params = []): array
    {
        $where = ['1=1'];
        $bindings = [];

        if (!empty($params['search'])) {
            $where[] = "(supplier_name ILIKE ? OR supplier_code ILIKE ? OR contact_person ILIKE ? OR gst_number ILIKE ?)";
            $s = '%' . $params['search'] . '%';
            $bindings = array_merge($bindings, [$s, $s, $s, $s]);
        }
        if (!empty($params['type'])) {
            $where[] = "supplier_type = ?";
            $bindings[] = $params['type'];
        }
        if (isset($params['status']) && $params['status'] !== '') {
            $where[] = "is_active = ?";
            $bindings[] = ($params['status'] === 'active');
        }

        $whereStr = implode(' AND ', $where);
        $page = max(1, (int)($params['page'] ?? 1));
        $perPage = min(100, max(1, (int)($params['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $countRow = $this->db->fetch("SELECT COUNT(*) as c FROM {$this->table} WHERE $whereStr", $bindings);
        $total = (int)($countRow['c'] ?? 0);

        $data = $this->db->fetchAll(
            "SELECT * FROM {$this->table} WHERE $whereStr ORDER BY supplier_name ASC LIMIT ? OFFSET ?",
            array_merge($bindings, [$perPage, $offset])
        );

        return ['data' => $data, 'total' => $total, 'page' => $page, 'per_page' => $perPage];
    }

    public function getWithStats(int $id): ?array
    {
        $supplier = $this->find($id);
        if (!$supplier) return null;

        $stats = $this->db->fetch(
            "SELECT COUNT(*) as total_purchases,
                    COALESCE(SUM(grand_total), 0) as total_spend,
                    MAX(purchase_date) as last_purchase_date
             FROM purchases WHERE supplier_id = ?",
            [$id]
        );

        return array_merge($supplier, [
            'total_purchases' => (int)($stats['total_purchases'] ?? 0),
            'total_spend' => (float)($stats['total_spend'] ?? 0),
            'last_purchase_date' => $stats['last_purchase_date'] ?? null,
        ]);
    }

    public function generateCode(): string
    {
        $last = $this->db->fetch("SELECT supplier_code FROM suppliers ORDER BY id DESC LIMIT 1");
        $num = 1;
        if ($last && preg_match('/SUP-(\d+)/', $last['supplier_code'], $m)) {
            $num = (int)$m[1] + 1;
        }
        return 'SUP-' . str_pad($num, 3, '0', STR_PAD_LEFT);
    }

    public function stats(): array
    {
        $row = $this->db->fetch(
            "SELECT COUNT(*) as total,
                    COUNT(*) FILTER (WHERE is_active = true) as active,
                    COUNT(*) FILTER (WHERE is_preferred = true) as preferred
             FROM suppliers"
        );
        return $row ?: ['total' => 0, 'active' => 0, 'preferred' => 0];
    }
}

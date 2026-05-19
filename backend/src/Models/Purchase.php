<?php

namespace App\Models;

class Purchase extends Model
{
    protected string $table = 'purchases';

    public function list(array $params = []): array
    {
        $where = ['1=1'];
        $bindings = [];

        if (!empty($params['search'])) {
            $s = '%' . $params['search'] . '%';
            $where[] = "(p.purchase_code ILIKE ? OR p.invoice_number ILIKE ? OR s.supplier_name ILIKE ?)";
            $bindings = array_merge($bindings, [$s, $s, $s]);
        }
        if (!empty($params['supplier_id'])) {
            $where[] = "p.supplier_id = ?";
            $bindings[] = (int)$params['supplier_id'];
        }
        if (!empty($params['status'])) {
            $where[] = "p.status = ?";
            $bindings[] = $params['status'];
        }
        if (!empty($params['from_date'])) {
            $where[] = "p.purchase_date >= ?";
            $bindings[] = $params['from_date'];
        }
        if (!empty($params['to_date'])) {
            $where[] = "p.purchase_date <= ?";
            $bindings[] = $params['to_date'];
        }

        $whereStr = implode(' AND ', $where);
        $page = max(1, (int)($params['page'] ?? 1));
        $perPage = min(100, max(1, (int)($params['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $total = (int)$this->db->queryOne(
            "SELECT COUNT(*) as c FROM purchases p JOIN suppliers s ON p.supplier_id = s.id WHERE $whereStr",
            $bindings
        )['c'];

        $data = $this->db->query(
            "SELECT p.*, s.supplier_name, s.supplier_code as supplier_code_ref,
                    b.name as branch_name, u.full_name as created_by_name,
                    au.full_name as approved_by_name,
                    (SELECT COUNT(*) FROM purchase_items WHERE purchase_id = p.id) as item_count,
                    (SELECT COUNT(*) FROM purchase_invoices WHERE purchase_id = p.id) as invoice_count,
                    (SELECT COUNT(*) FROM purchase_asset_links WHERE purchase_id = p.id) as assets_generated
             FROM purchases p
             JOIN suppliers s ON p.supplier_id = s.id
             JOIN branches b ON p.receiving_branch_id = b.id
             LEFT JOIN users u ON p.created_by = u.id
             LEFT JOIN users au ON p.approved_by = au.id
             WHERE $whereStr
             ORDER BY p.created_at DESC LIMIT ? OFFSET ?",
            array_merge($bindings, [$perPage, $offset])
        );

        return ['data' => $data, 'total' => $total, 'page' => $page, 'per_page' => $perPage];
    }

    public function getDetail(int $id): ?array
    {
        $purchase = $this->db->queryOne(
            "SELECT p.*, s.supplier_name, s.supplier_code as supplier_code_ref, s.gst_number as supplier_gst,
                    b.name as branch_name, d.name as department_name,
                    u.full_name as created_by_name, au.full_name as approved_by_name
             FROM purchases p
             JOIN suppliers s ON p.supplier_id = s.id
             JOIN branches b ON p.receiving_branch_id = b.id
             LEFT JOIN departments d ON p.receiving_department_id = d.id
             LEFT JOIN users u ON p.created_by = u.id
             LEFT JOIN users au ON p.approved_by = au.id
             WHERE p.id = ?",
            [$id]
        );
        if (!$purchase) return null;

        $purchase['items'] = $this->db->query(
            "SELECT pi.*, c.name as category_name
             FROM purchase_items pi
             LEFT JOIN categories c ON pi.category_id = c.id
             WHERE pi.purchase_id = ? ORDER BY pi.id",
            [$id]
        );

        $purchase['invoices'] = $this->db->query(
            "SELECT pi.*, u.full_name as uploaded_by_name
             FROM purchase_invoices pi
             LEFT JOIN users u ON pi.uploaded_by = u.id
             WHERE pi.purchase_id = ? ORDER BY pi.uploaded_at DESC",
            [$id]
        );

        $purchase['generated_assets'] = $this->db->query(
            "SELECT pal.*, a.name as asset_name, a.status as asset_status
             FROM purchase_asset_links pal
             JOIN assets a ON pal.asset_code = a.asset_code
             WHERE pal.purchase_id = ? ORDER BY pal.generated_at",
            [$id]
        );

        // Timeline
        $purchase['timeline'] = $this->buildTimeline($purchase);

        return $purchase;
    }

    private function buildTimeline(array $p): array
    {
        $tl = [['event' => 'created', 'date' => $p['created_at'], 'by' => $p['created_by_name'], 'done' => true]];

        if ($p['status'] === 'pending' || $p['status'] === 'approved' || $p['status'] === 'completed') {
            $tl[] = ['event' => 'submitted', 'date' => $p['updated_at'], 'done' => true];
        }

        if ($p['status'] === 'approved' || $p['status'] === 'completed') {
            $tl[] = ['event' => 'approved', 'date' => $p['approved_at'], 'by' => $p['approved_by_name'], 'done' => true];
        } elseif ($p['status'] === 'rejected') {
            $tl[] = ['event' => 'rejected', 'date' => $p['approved_at'], 'by' => $p['approved_by_name'], 'done' => true];
        } else {
            $tl[] = ['event' => 'approved', 'done' => false];
        }

        $hasInvoice = count($p['invoices'] ?? []) > 0;
        $tl[] = ['event' => 'invoice_uploaded', 'date' => $hasInvoice ? $p['invoices'][0]['uploaded_at'] : null, 'done' => $hasInvoice];

        $hasAssets = count($p['generated_assets'] ?? []) > 0;
        $tl[] = ['event' => 'assets_generated', 'date' => $hasAssets ? $p['generated_assets'][0]['generated_at'] : null, 'done' => $hasAssets];

        if ($p['status'] === 'completed') {
            $tl[] = ['event' => 'completed', 'date' => $p['updated_at'], 'done' => true];
        } else {
            $tl[] = ['event' => 'completed', 'done' => false];
        }

        return $tl;
    }

    public function generateCode(): string
    {
        $year = date('Y');
        $last = $this->db->queryOne(
            "SELECT purchase_code FROM purchases WHERE purchase_code LIKE ? ORDER BY id DESC LIMIT 1",
            ["PUR-$year-%"]
        );
        $num = 1;
        if ($last && preg_match('/PUR-\d{4}-(\d+)/', $last['purchase_code'], $m)) {
            $num = (int)$m[1] + 1;
        }
        return "PUR-$year-" . str_pad($num, 3, '0', STR_PAD_LEFT);
    }

    public function recalcTotals(int $id): void
    {
        $this->db->query(
            "UPDATE purchases SET
                subtotal = (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM purchase_items WHERE purchase_id = ?),
                grand_total = subtotal + gst_amount - discount_amount
             WHERE id = ?",
            [$id, $id]
        );
    }

    public function stats(): array
    {
        return $this->db->queryOne(
            "SELECT COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'pending') as pending,
                    COALESCE(SUM(grand_total), 0) as total_spend,
                    COALESCE(SUM(grand_total) FILTER (WHERE purchase_date >= date_trunc('month', CURRENT_DATE)), 0) as month_spend
             FROM purchases"
        );
    }
}

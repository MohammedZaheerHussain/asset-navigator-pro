<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Core\Database;
use App\Models\Supplier;
use App\Models\Purchase;

/**
 * Procurement Controller
 *
 * Handles Suppliers, Purchases, Items, Invoices, and Asset Generation.
 */
class ProcurementController
{
    private Supplier $supplierModel;
    private Purchase $purchaseModel;
    private Database $db;

    public function __construct()
    {
        $this->supplierModel = new Supplier();
        $this->purchaseModel = new Purchase();
        $this->db = Database::getInstance();
    }

    // ─── SUPPLIERS ──────────────────────────────────────────────

    public function listSuppliers(Request $request): void
    {
        $result = $this->supplierModel->list($request->all());
        Response::paginated($result['data'], $result['total'], $result['page'], $result['per_page'], 'Suppliers retrieved');
    }

    public function createSupplier(Request $request): void
    {
        $errors = Validator::make($request->all(), [
            'supplier_name' => 'required|string|max:200',
            'supplier_type' => 'required|string',
        ]);
        if ($errors) { Response::validationError($errors); return; }

        $data = $request->all();
        $data['supplier_code'] = $this->supplierModel->generateCode();
        $data['created_by'] = $request->user()['sub'] ?? null;

        $id = $this->supplierModel->create($data);
        $supplier = $this->supplierModel->find((int)$id);
        Response::created($supplier, 'Supplier created');
    }

    public function getSupplier(Request $request): void
    {
        $id = (int)$request->param('id');
        $supplier = $this->supplierModel->getWithStats($id);
        if (!$supplier) { Response::notFound('Supplier not found'); return; }
        Response::success($supplier);
    }

    public function updateSupplier(Request $request): void
    {
        $id = (int)$request->param('id');
        if (!$this->supplierModel->find($id)) { Response::notFound('Supplier not found'); return; }
        $this->supplierModel->update($id, $request->all());
        Response::success($this->supplierModel->find($id), 'Supplier updated');
    }

    public function deleteSupplier(Request $request): void
    {
        $id = (int)$request->param('id');
        $this->supplierModel->update($id, ['is_active' => false]);
        Response::success(null, 'Supplier deactivated');
    }

    public function supplierStats(Request $request): void
    {
        Response::success($this->supplierModel->stats());
    }

    // ─── PURCHASES ──────────────────────────────────────────────

    public function listPurchases(Request $request): void
    {
        $result = $this->purchaseModel->list($request->all());
        Response::paginated($result['data'], $result['total'], $result['page'], $result['per_page'], 'Purchases retrieved');
    }

    public function createPurchase(Request $request): void
    {
        $errors = Validator::make($request->all(), [
            'supplier_id'         => 'required|integer',
            'purchase_date'       => 'required|string',
            'receiving_branch_id' => 'required|integer',
        ]);
        if ($errors) { Response::validationError($errors); return; }

        $data = $request->all();
        $items = $data['items'] ?? [];
        unset($data['items']);

        $data['purchase_code'] = $this->purchaseModel->generateCode();
        $data['created_by'] = $request->user()['sub'] ?? null;
        $data['status'] = $data['status'] ?? 'draft';

        // Calculate totals from items
        $subtotal = 0;
        foreach ($items as $item) {
            $subtotal += ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0);
        }
        $data['subtotal'] = $subtotal;
        $data['grand_total'] = $subtotal + ($data['gst_amount'] ?? 0) - ($data['discount_amount'] ?? 0);

        $purchaseId = $this->purchaseModel->create($data);

        // Insert items
        foreach ($items as $item) {
            $this->db->query(
                "INSERT INTO purchase_items (purchase_id, item_name, category_id, quantity, unit_price, warranty_months, serial_prefix, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $purchaseId,
                    $item['item_name'] ?? 'Unnamed Item',
                    $item['category_id'] ?? null,
                    $item['quantity'] ?? 1,
                    $item['unit_price'] ?? 0,
                    $item['warranty_months'] ?? 0,
                    $item['serial_prefix'] ?? null,
                    $item['notes'] ?? null,
                ]
            );
        }

        $purchase = $this->purchaseModel->getDetail((int)$purchaseId);
        Response::created($purchase, 'Purchase entry created');
    }

    public function getPurchase(Request $request): void
    {
        $id = (int)$request->param('id');
        $purchase = $this->purchaseModel->getDetail($id);
        if (!$purchase) { Response::notFound('Purchase not found'); return; }
        Response::success($purchase);
    }

    public function updatePurchase(Request $request): void
    {
        $id = (int)$request->param('id');
        $existing = $this->purchaseModel->find($id);
        if (!$existing) { Response::notFound('Purchase not found'); return; }
        if ($existing['status'] === 'completed') {
            Response::error('Cannot edit completed purchase', 400);
            return;
        }

        $data = $request->all();
        $items = $data['items'] ?? null;
        unset($data['items']);

        // Update purchase header
        $this->purchaseModel->update($id, $data);

        // Replace items if provided
        if ($items !== null) {
            $this->db->query("DELETE FROM purchase_items WHERE purchase_id = ?", [$id]);
            foreach ($items as $item) {
                $this->db->query(
                    "INSERT INTO purchase_items (purchase_id, item_name, category_id, quantity, unit_price, warranty_months, serial_prefix, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [$id, $item['item_name'] ?? '', $item['category_id'] ?? null, $item['quantity'] ?? 1,
                     $item['unit_price'] ?? 0, $item['warranty_months'] ?? 0, $item['serial_prefix'] ?? null, $item['notes'] ?? null]
                );
            }
            $this->purchaseModel->recalcTotals($id);
        }

        Response::success($this->purchaseModel->getDetail($id), 'Purchase updated');
    }

    public function approvePurchase(Request $request): void
    {
        $id = (int)$request->param('id');
        $existing = $this->purchaseModel->find($id);
        if (!$existing) { Response::notFound('Purchase not found'); return; }

        $this->purchaseModel->update($id, [
            'status' => 'approved',
            'approved_by' => $request->user()['sub'] ?? null,
            'approved_at' => date('Y-m-d H:i:s'),
        ]);

        Response::success($this->purchaseModel->getDetail($id), 'Purchase approved');
    }

    public function rejectPurchase(Request $request): void
    {
        $id = (int)$request->param('id');
        $existing = $this->purchaseModel->find($id);
        if (!$existing) { Response::notFound('Purchase not found'); return; }

        $this->purchaseModel->update($id, [
            'status' => 'rejected',
            'approved_by' => $request->user()['sub'] ?? null,
            'approved_at' => date('Y-m-d H:i:s'),
        ]);

        Response::success(null, 'Purchase rejected');
    }

    public function purchaseStats(Request $request): void
    {
        Response::success($this->purchaseModel->stats());
    }

    // ─── ASSET GENERATION ───────────────────────────────────────

    public function generateAssets(Request $request): void
    {
        $id = (int)$request->param('id');
        $purchase = $this->purchaseModel->getDetail($id);
        if (!$purchase) { Response::notFound('Purchase not found'); return; }
        if ($purchase['status'] !== 'approved') {
            Response::error('Purchase must be approved before generating assets', 400);
            return;
        }

        // Check if assets already generated
        $existingLinks = $this->db->queryOne(
            "SELECT COUNT(*) as c FROM purchase_asset_links WHERE purchase_id = ?", [$id]
        );
        if ((int)$existingLinks['c'] > 0) {
            Response::error('Assets have already been generated for this purchase', 400);
            return;
        }

        $generated = [];
        foreach ($purchase['items'] as $item) {
            $categoryId = $item['category_id'];
            $qty = (int)$item['quantity'];

            // Get category code prefix
            $cat = $this->db->queryOne("SELECT name FROM categories WHERE id = ?", [$categoryId]);
            $catPrefix = $cat ? strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $cat['name']), 0, 3)) : 'GEN';

            for ($i = 0; $i < $qty; $i++) {
                // Generate unique asset code
                $lastAsset = $this->db->queryOne(
                    "SELECT asset_code FROM assets WHERE asset_code LIKE ? ORDER BY asset_code DESC LIMIT 1",
                    ["AST-$catPrefix-%"]
                );
                $num = 1;
                if ($lastAsset && preg_match('/AST-[A-Z]+-(\d+)/', $lastAsset['asset_code'], $m)) {
                    $num = (int)$m[1] + 1;
                }
                $assetCode = "AST-$catPrefix-" . str_pad($num, 3, '0', STR_PAD_LEFT);

                // Calculate warranty expiry
                $warrantyExpiry = null;
                if ($item['warranty_months'] > 0 && $purchase['purchase_date']) {
                    $warrantyExpiry = date('Y-m-d', strtotime($purchase['purchase_date'] . " + {$item['warranty_months']} months"));
                }

                // Serial number
                $serial = $item['serial_prefix']
                    ? $item['serial_prefix'] . '-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT)
                    : null;

                // Create asset
                $this->db->query(
                    "INSERT INTO assets (asset_code, name, description, category_id, serial_number, branch_id, department_id, status, purchase_date, purchase_cost, warranty_expiry, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)",
                    [
                        $assetCode,
                        $item['item_name'],
                        "Auto-generated from purchase {$purchase['purchase_code']}",
                        $categoryId,
                        $serial,
                        $purchase['receiving_branch_id'],
                        $purchase['receiving_department_id'] ?? $this->getDefaultDept($purchase['receiving_branch_id']),
                        $purchase['purchase_date'],
                        $item['unit_price'],
                        $warrantyExpiry,
                        "Source: {$purchase['purchase_code']}, Item: {$item['item_name']}"
                    ]
                );

                // Link
                $this->db->query(
                    "INSERT INTO purchase_asset_links (purchase_id, purchase_item_id, asset_code) VALUES (?, ?, ?)",
                    [$id, $item['id'], $assetCode]
                );

                // Activity log
                $this->db->query(
                    "INSERT INTO activity_logs (asset_code, action, details, performed_by) VALUES (?, 'created', ?::jsonb, ?)",
                    [$assetCode, json_encode(['source' => 'procurement', 'purchase_code' => $purchase['purchase_code']]), $request->user()['sub'] ?? null]
                );

                $generated[] = ['asset_code' => $assetCode, 'name' => $item['item_name']];
            }
        }

        // Mark purchase completed
        $this->purchaseModel->update($id, ['status' => 'completed', 'auto_generate_assets' => true]);

        Response::success([
            'assets_generated' => count($generated),
            'assets' => $generated,
        ], count($generated) . ' assets generated successfully');
    }

    private function getDefaultDept(int $branchId): int
    {
        $dept = $this->db->queryOne("SELECT id FROM departments WHERE branch_id = ? LIMIT 1", [$branchId]);
        return $dept ? (int)$dept['id'] : 1;
    }

    // ─── INVOICES ───────────────────────────────────────────────

    public function listInvoicesForPurchase(Request $request): void
    {
        $id = (int)$request->param('id');
        $invoices = $this->db->query(
            "SELECT pi.*, u.full_name as uploaded_by_name FROM purchase_invoices pi
             LEFT JOIN users u ON pi.uploaded_by = u.id WHERE pi.purchase_id = ? ORDER BY pi.uploaded_at DESC", [$id]
        );
        Response::success($invoices);
    }

    public function uploadInvoice(Request $request): void
    {
        $id = (int)$request->param('id');
        if (!$this->purchaseModel->find($id)) { Response::notFound('Purchase not found'); return; }

        // For now, accept base64 file data or file URL
        $data = $request->all();
        $this->db->query(
            "INSERT INTO purchase_invoices (purchase_id, file_name, file_path, file_type, file_size, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?)",
            [
                $id,
                $data['file_name'] ?? 'invoice.pdf',
                $data['file_path'] ?? '/uploads/invoices/' . $id . '_' . time(),
                $data['file_type'] ?? 'application/pdf',
                $data['file_size'] ?? 0,
                $request->user()['sub'] ?? null,
            ]
        );

        Response::created(null, 'Invoice uploaded');
    }

    public function listAllInvoices(Request $request): void
    {
        $search = $request->input('search');
        $where = '1=1';
        $bindings = [];

        if ($search) {
            $where .= " AND (pi.file_name ILIKE ? OR p.purchase_code ILIKE ? OR p.invoice_number ILIKE ? OR s.supplier_name ILIKE ?)";
            $s = "%$search%";
            $bindings = [$s, $s, $s, $s];
        }

        $invoices = $this->db->query(
            "SELECT pi.*, p.purchase_code, p.invoice_number, p.grand_total, s.supplier_name
             FROM purchase_invoices pi
             JOIN purchases p ON pi.purchase_id = p.id
             JOIN suppliers s ON p.supplier_id = s.id
             WHERE $where
             ORDER BY pi.uploaded_at DESC LIMIT 100",
            $bindings
        );
        Response::success($invoices);
    }

    public function deleteInvoice(Request $request): void
    {
        $id = (int)$request->param('id');
        $this->db->query("DELETE FROM purchase_invoices WHERE id = ?", [$id]);
        Response::success(null, 'Invoice deleted');
    }
}

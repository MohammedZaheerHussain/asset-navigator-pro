<?php

namespace App\Controllers;

use App\Core\Response;
use App\Models\ServiceRecord;
use App\Models\DepreciationConfig;
use App\Models\CondemnationRequest;
use App\Models\AssetDisposal;

class ServiceController
{
    private ServiceRecord $serviceModel;
    private DepreciationConfig $depConfig;
    private CondemnationRequest $condemnModel;
    private AssetDisposal $disposalModel;

    public function __construct()
    {
        $this->serviceModel = new ServiceRecord();
        $this->depConfig = new DepreciationConfig();
        $this->condemnModel = new CondemnationRequest();
        $this->disposalModel = new AssetDisposal();
    }

    // ─── Service Records ────────────────────────────────────────

    public function listServices(): void
    {
        $filters = [
            'asset_code'   => $_GET['asset_code'] ?? null,
            'service_type' => $_GET['service_type'] ?? null,
            'search'       => $_GET['search'] ?? null,
            'date_from'    => $_GET['date_from'] ?? null,
            'date_to'      => $_GET['date_to'] ?? null,
        ];
        $records = $this->serviceModel->getAll(array_filter($filters));

        // Add formatted cost
        foreach ($records as &$r) {
            $r['total_cost_display'] = '₹' . number_format((float)$r['total_cost'], 2);
        }

        Response::success($records, 'Service records retrieved');
    }

    public function getService(int $id): void
    {
        $record = $this->serviceModel->getById($id);
        if (!$record) {
            Response::notFound('Service record not found');
            return;
        }
        Response::success($record);
    }

    public function getAssetServices(string $assetCode): void
    {
        $records = $this->serviceModel->getByAsset($assetCode);
        $summary = $this->serviceModel->getAssetServiceSummary($assetCode);
        Response::success([
            'records' => $records,
            'summary' => $summary,
        ], 'Asset service history retrieved');
    }

    public function createService(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['asset_code']) || empty($data['description'])) {
            Response::validationError(['asset_code and description are required']);
            return;
        }

        $data['logged_by'] = $GLOBALS['auth_user']['id'] ?? null;
        $record = $this->serviceModel->store($data);
        Response::success($record, 'Service record created', 201);
    }

    public function updateService(int $id): void
    {
        $existing = $this->serviceModel->getById($id);
        if (!$existing) {
            Response::notFound('Service record not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $updated = $this->serviceModel->update($id, $data);
        Response::success($updated, 'Service record updated');
    }

    public function deleteService(int $id): void
    {
        if ($this->serviceModel->destroy($id)) {
            Response::success(null, 'Service record deleted');
        } else {
            Response::notFound('Service record not found');
        }
    }

    public function serviceDashboard(): void
    {
        $stats = $this->serviceModel->getDashboardStats();
        Response::success($stats, 'Service dashboard stats');
    }

    // ─── Depreciation ───────────────────────────────────────────

    public function listDepreciationConfigs(): void
    {
        $configs = $this->depConfig->getAll();
        Response::success($configs, 'Depreciation configs retrieved');
    }

    public function upsertDepreciationConfig(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['category_id'])) {
            Response::validationError(['category_id is required']);
            return;
        }

        $config = $this->depConfig->upsert($data);
        Response::success($config, 'Depreciation config saved');
    }

    public function getAssetDepreciation(string $assetCode): void
    {
        // Get asset
        $db = new \App\Core\Database();
        $asset = $db->fetch("SELECT * FROM assets WHERE asset_code = ?", [$assetCode]);
        if (!$asset) {
            Response::notFound('Asset not found');
            return;
        }

        $depreciation = $this->depConfig->calculateDepreciation($asset);
        Response::success($depreciation, 'Depreciation calculated');
    }

    public function getAssetValuation(string $assetCode): void
    {
        // Get asset
        $db = new \App\Core\Database();
        $asset = $db->fetch("SELECT * FROM assets WHERE asset_code = ?", [$assetCode]);
        if (!$asset) {
            Response::notFound('Asset not found');
            return;
        }

        // Depreciation
        $depreciation = $this->depConfig->calculateDepreciation($asset);

        // Service costs
        $serviceSummary = $this->serviceModel->getAssetServiceSummary($assetCode);
        $totalServiceCost = (float)($serviceSummary['total_service_cost'] ?? 0);
        $bookValue = (float)$depreciation['current_book_value'];

        // Ratio
        $ratio = $bookValue > 0 ? round(($totalServiceCost / $bookValue) * 100, 1) : 0;

        // Get threshold
        $config = $this->depConfig->getByCategory($asset['category_id']);
        $threshold = (float)($config['service_cost_threshold_percent'] ?? 50);

        // Health status
        if ($ratio < 30) $health = 'healthy';
        elseif ($ratio < $threshold) $health = 'warning';
        else $health = 'critical';

        Response::success([
            'asset_code'          => $assetCode,
            'asset_name'          => $asset['name'],
            'purchase_cost'       => (float)$asset['purchase_cost'],
            'purchase_date'       => $asset['purchase_date'],
            'current_book_value'  => $bookValue,
            'total_service_cost'  => $totalServiceCost,
            'service_cost_ratio'  => $ratio,
            'threshold_percent'   => $threshold,
            'health_status'       => $health,
            'total_services'      => (int)($serviceSummary['total_services'] ?? 0),
            'last_service'        => $serviceSummary['last_service'] ?? null,
            'depreciation'        => $depreciation,
            'service_summary'     => $serviceSummary,
        ], 'Asset valuation calculated');
    }

    public function depreciationReport(): void
    {
        $db = new \App\Core\Database();
        $assets = $db->fetchAll("SELECT * FROM assets WHERE is_deleted = false ORDER BY asset_code");

        $report = [];
        foreach ($assets as $asset) {
            $dep = $this->depConfig->calculateDepreciation($asset);
            $svc = $this->serviceModel->getAssetServiceSummary($asset['asset_code']);
            $totalSvc = (float)($svc['total_service_cost'] ?? 0);
            $bookVal = (float)$dep['current_book_value'];
            $ratio = $bookVal > 0 ? round(($totalSvc / $bookVal) * 100, 1) : 0;

            $config = $this->depConfig->getByCategory($asset['category_id']);
            $threshold = (float)($config['service_cost_threshold_percent'] ?? 50);

            $report[] = [
                'asset_code'         => $asset['asset_code'],
                'asset_name'         => $asset['name'],
                'status'             => $asset['status'],
                'purchase_cost'      => (float)$asset['purchase_cost'],
                'current_book_value' => $bookVal,
                'total_service_cost' => $totalSvc,
                'service_cost_ratio' => $ratio,
                'health_status'      => $ratio < 30 ? 'healthy' : ($ratio < $threshold ? 'warning' : 'critical'),
                'years_used'         => $dep['years_used'],
                'remaining_life'     => $dep['remaining_life_years'],
            ];
        }

        // Sort by ratio desc (worst first)
        usort($report, fn($a, $b) => $b['service_cost_ratio'] <=> $a['service_cost_ratio']);

        Response::success($report, 'Depreciation report generated');
    }

    public function flaggedAssets(): void
    {
        $db = new \App\Core\Database();
        $assets = $db->fetchAll("SELECT * FROM assets WHERE is_deleted = false ORDER BY asset_code");

        $flagged = [];
        foreach ($assets as $asset) {
            $dep = $this->depConfig->calculateDepreciation($asset);
            $svc = $this->serviceModel->getAssetServiceSummary($asset['asset_code']);
            $totalSvc = (float)($svc['total_service_cost'] ?? 0);
            $bookVal = (float)$dep['current_book_value'];
            $ratio = $bookVal > 0 ? round(($totalSvc / $bookVal) * 100, 1) : 0;

            $config = $this->depConfig->getByCategory($asset['category_id']);
            $threshold = (float)($config['service_cost_threshold_percent'] ?? 50);

            if ($ratio >= $threshold) {
                $flagged[] = [
                    'asset_code'         => $asset['asset_code'],
                    'asset_name'         => $asset['name'],
                    'status'             => $asset['status'],
                    'purchase_cost'      => (float)$asset['purchase_cost'],
                    'current_book_value' => $bookVal,
                    'total_service_cost' => $totalSvc,
                    'service_cost_ratio' => $ratio,
                    'threshold_percent'  => $threshold,
                    'total_services'     => (int)($svc['total_services'] ?? 0),
                ];
            }
        }

        usort($flagged, fn($a, $b) => $b['service_cost_ratio'] <=> $a['service_cost_ratio']);
        Response::success($flagged, count($flagged) . ' flagged assets found');
    }

    // ─── Condemnation ───────────────────────────────────────────

    public function listCondemnations(): void
    {
        $filters = [
            'status'          => $_GET['status'] ?? null,
            'reason_category' => $_GET['reason_category'] ?? null,
            'search'          => $_GET['search'] ?? null,
        ];
        $requests = $this->condemnModel->getAll(array_filter($filters));
        Response::success($requests, 'Condemnation requests retrieved');
    }

    public function getCondemnation(int $id): void
    {
        $request = $this->condemnModel->getById($id);
        if (!$request) {
            Response::notFound('Condemnation request not found');
            return;
        }

        // Attach service history
        $services = $this->serviceModel->getByAsset($request['asset_code']);
        $request['service_history'] = $services;

        Response::success($request);
    }

    public function createCondemnation(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['asset_code']) || empty($data['reason'])) {
            Response::validationError(['asset_code and reason are required']);
            return;
        }

        // Auto-fill financial snapshot
        $db = new \App\Core\Database();
        $asset = $db->fetch("SELECT * FROM assets WHERE asset_code = ?", [$data['asset_code']]);
        if (!$asset) {
            Response::notFound('Asset not found');
            return;
        }

        $dep = $this->depConfig->calculateDepreciation($asset);
        $svc = $this->serviceModel->getAssetServiceSummary($data['asset_code']);
        $totalSvc = (float)($svc['total_service_cost'] ?? 0);
        $bookVal = (float)$dep['current_book_value'];

        $data['purchase_cost'] = (float)$asset['purchase_cost'];
        $data['current_book_value'] = $bookVal;
        $data['total_service_cost'] = $totalSvc;
        $data['service_cost_ratio'] = $bookVal > 0 ? round(($totalSvc / $bookVal) * 100, 1) : 0;
        $data['requested_by'] = $GLOBALS['auth_user']['id'];

        // Update asset status to flagged
        $db->query("UPDATE assets SET status = 'flagged', updated_at = NOW() WHERE asset_code = ?", [$data['asset_code']]);

        $request = $this->condemnModel->store($data);
        Response::success($request, 'Condemnation request submitted', 201);
    }

    public function reviewCondemnation(int $id): void
    {
        $existing = $this->condemnModel->getById($id);
        if (!$existing) {
            Response::notFound('Condemnation request not found');
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['status']) || !in_array($data['status'], ['approved', 'rejected', 'deferred'])) {
            Response::validationError(['status must be approved, rejected, or deferred']);
            return;
        }

        $data['reviewed_by'] = $GLOBALS['auth_user']['id'];
        $updated = $this->condemnModel->review($id, $data);

        // If approved, mark asset as condemned
        if ($data['status'] === 'approved') {
            $db = new \App\Core\Database();
            $db->query("UPDATE assets SET status = 'condemned', updated_at = NOW() WHERE asset_code = ?", [$existing['asset_code']]);
        }
        // If rejected, revert to active
        if ($data['status'] === 'rejected') {
            $db = new \App\Core\Database();
            $db->query("UPDATE assets SET status = 'active', updated_at = NOW() WHERE asset_code = ?", [$existing['asset_code']]);
        }

        Response::success($updated, 'Condemnation request ' . $data['status']);
    }

    // ─── Disposal ───────────────────────────────────────────────

    public function listDisposals(): void
    {
        $filters = [
            'disposal_method' => $_GET['disposal_method'] ?? null,
            'search'          => $_GET['search'] ?? null,
        ];
        $disposals = $this->disposalModel->getAll(array_filter($filters));
        Response::success($disposals, 'Disposals retrieved');
    }

    public function createDisposal(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['asset_code']) || empty($data['condemnation_id'])) {
            Response::validationError(['asset_code and condemnation_id are required']);
            return;
        }

        // Verify condemnation is approved
        $condemn = $this->condemnModel->getById($data['condemnation_id']);
        if (!$condemn || $condemn['status'] !== 'approved') {
            Response::error('Condemnation must be approved before disposal', 400);
            return;
        }

        $data['disposed_by'] = $GLOBALS['auth_user']['id'];
        $disposal = $this->disposalModel->store($data);

        // Mark asset as disposed
        $db = new \App\Core\Database();
        $db->query("UPDATE assets SET status = 'disposed', updated_at = NOW() WHERE asset_code = ?", [$data['asset_code']]);

        Response::success($disposal, 'Disposal recorded', 201);
    }

    public function disposalStats(): void
    {
        $stats = $this->disposalModel->getStats();
        Response::success($stats, 'Disposal statistics');
    }
}

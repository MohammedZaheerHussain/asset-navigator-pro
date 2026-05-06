<?php

namespace App\Controllers;

use App\Core\Request;
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

    public function listServices(Request $request): void
    {
        $filters = [
            'asset_code'   => $request->query('asset_code'),
            'service_type' => $request->query('service_type'),
            'search'       => $request->query('search'),
            'date_from'    => $request->query('date_from'),
            'date_to'      => $request->query('date_to'),
        ];
        $records = $this->serviceModel->getAll(array_filter($filters));

        foreach ($records as &$r) {
            $r['total_cost_display'] = '₹' . number_format((float)$r['total_cost'], 2);
        }

        Response::success($records, 'Service records retrieved');
    }

    public function getService(Request $request): void
    {
        $id = (int) $request->param('id');
        $record = $this->serviceModel->getById($id);
        if (!$record) {
            Response::notFound('Service record not found');
            return;
        }
        Response::success($record);
    }

    public function getAssetServices(Request $request): void
    {
        $assetCode = $request->param('code');
        $records = $this->serviceModel->getByAsset($assetCode);
        $summary = $this->serviceModel->getAssetServiceSummary($assetCode);
        Response::success([
            'records' => $records,
            'summary' => $summary,
        ], 'Asset service history retrieved');
    }

    public function createService(Request $request): void
    {
        $data = $request->all();

        if (empty($data['asset_code']) || empty($data['description'])) {
            Response::validationError(['asset_code and description are required']);
            return;
        }

        $user = $request->user();
        $data['logged_by'] = $user['sub'] ?? null;
        $record = $this->serviceModel->store($data);
        Response::created($record, 'Service record created');
    }

    public function updateService(Request $request): void
    {
        $id = (int) $request->param('id');
        $existing = $this->serviceModel->getById($id);
        if (!$existing) {
            Response::notFound('Service record not found');
            return;
        }

        $data = $request->all();
        $updated = $this->serviceModel->updateRecord($id, $data);
        Response::success($updated, 'Service record updated');
    }

    public function deleteService(Request $request): void
    {
        $id = (int) $request->param('id');
        if ($this->serviceModel->deleteRecord($id)) {
            Response::success(null, 'Service record deleted');
        } else {
            Response::notFound('Service record not found');
        }
    }

    public function serviceDashboard(Request $request): void
    {
        $stats = $this->serviceModel->getDashboardStats();
        Response::success($stats, 'Service dashboard stats');
    }

    // ─── Depreciation ───────────────────────────────────────────

    public function listDepreciationConfigs(Request $request): void
    {
        $configs = $this->depConfig->getAll();
        Response::success($configs, 'Depreciation configs retrieved');
    }

    public function upsertDepreciationConfig(Request $request): void
    {
        $data = $request->all();

        if (empty($data['category_id'])) {
            Response::validationError(['category_id is required']);
            return;
        }

        $config = $this->depConfig->upsert($data);
        Response::success($config, 'Depreciation config saved');
    }

    public function getAssetDepreciation(Request $request): void
    {
        $assetCode = $request->param('code');
        $asset = \App\Core\Database::getInstance()->fetch("SELECT * FROM assets WHERE asset_code = ?", [$assetCode]);
        if (!$asset) {
            Response::notFound('Asset not found');
            return;
        }

        $depreciation = $this->depConfig->calculateDepreciation($asset);
        Response::success($depreciation, 'Depreciation calculated');
    }

    public function getAssetValuation(Request $request): void
    {
        $assetCode = $request->param('code');
        $asset = \App\Core\Database::getInstance()->fetch("SELECT * FROM assets WHERE asset_code = ?", [$assetCode]);
        if (!$asset) {
            Response::notFound('Asset not found');
            return;
        }

        $depreciation = $this->depConfig->calculateDepreciation($asset);
        $serviceSummary = $this->serviceModel->getAssetServiceSummary($assetCode);
        $totalServiceCost = (float)($serviceSummary['total_service_cost'] ?? 0);
        $bookValue = (float)$depreciation['current_book_value'];

        $ratio = $bookValue > 0 ? round(($totalServiceCost / $bookValue) * 100, 1) : 0;

        $config = $this->depConfig->getByCategory($asset['category_id']);
        $threshold = (float)($config['service_cost_threshold_percent'] ?? 50);

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

    public function depreciationReport(Request $request): void
    {
        $assets = \App\Core\Database::getInstance()->fetchAll("SELECT * FROM assets WHERE is_deleted = false ORDER BY asset_code");

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

        usort($report, fn($a, $b) => $b['service_cost_ratio'] <=> $a['service_cost_ratio']);
        Response::success($report, 'Depreciation report generated');
    }

    public function flaggedAssets(Request $request): void
    {
        $assets = \App\Core\Database::getInstance()->fetchAll("SELECT * FROM assets WHERE is_deleted = false ORDER BY asset_code");

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

    public function listCondemnations(Request $request): void
    {
        $filters = [
            'status'          => $request->query('status'),
            'reason_category' => $request->query('reason_category'),
            'search'          => $request->query('search'),
        ];
        $requests = $this->condemnModel->getAll(array_filter($filters));
        Response::success($requests, 'Condemnation requests retrieved');
    }

    public function getCondemnation(Request $request): void
    {
        $id = (int) $request->param('id');
        $record = $this->condemnModel->getById($id);
        if (!$record) {
            Response::notFound('Condemnation request not found');
            return;
        }

        $services = $this->serviceModel->getByAsset($record['asset_code']);
        $record['service_history'] = $services;

        Response::success($record);
    }

    public function createCondemnation(Request $request): void
    {
        $data = $request->all();

        if (empty($data['asset_code']) || empty($data['reason'])) {
            Response::validationError(['asset_code and reason are required']);
            return;
        }

        $asset = \App\Core\Database::getInstance()->fetch("SELECT * FROM assets WHERE asset_code = ?", [$data['asset_code']]);
        if (!$asset) {
            Response::notFound('Asset not found');
            return;
        }

        $dep = $this->depConfig->calculateDepreciation($asset);
        $svc = $this->serviceModel->getAssetServiceSummary($data['asset_code']);
        $totalSvc = (float)($svc['total_service_cost'] ?? 0);
        $bookVal = (float)$dep['current_book_value'];

        $user = $request->user();
        $data['purchase_cost'] = (float)$asset['purchase_cost'];
        $data['current_book_value'] = $bookVal;
        $data['total_service_cost'] = $totalSvc;
        $data['service_cost_ratio'] = $bookVal > 0 ? round(($totalSvc / $bookVal) * 100, 1) : 0;
        $data['requested_by'] = $user['sub'] ?? null;

        \App\Core\Database::getInstance()->query("UPDATE assets SET status = 'flagged', updated_at = NOW() WHERE asset_code = ?", [$data['asset_code']]);

        $result = $this->condemnModel->store($data);
        Response::created($result, 'Condemnation request submitted');
    }

    public function reviewCondemnation(Request $request): void
    {
        $id = (int) $request->param('id');
        $existing = $this->condemnModel->getById($id);
        if (!$existing) {
            Response::notFound('Condemnation request not found');
            return;
        }

        $data = $request->all();

        if (empty($data['status']) || !in_array($data['status'], ['approved', 'rejected', 'deferred'])) {
            Response::validationError(['status must be approved, rejected, or deferred']);
            return;
        }

        $user = $request->user();
        $data['reviewed_by'] = $user['sub'] ?? null;
        $updated = $this->condemnModel->review($id, $data);

        if ($data['status'] === 'approved') {
            \App\Core\Database::getInstance()->query("UPDATE assets SET status = 'condemned', updated_at = NOW() WHERE asset_code = ?", [$existing['asset_code']]);
        }
        if ($data['status'] === 'rejected') {
            \App\Core\Database::getInstance()->query("UPDATE assets SET status = 'active', updated_at = NOW() WHERE asset_code = ?", [$existing['asset_code']]);
        }

        Response::success($updated, 'Condemnation request ' . $data['status']);
    }

    // ─── Disposal ───────────────────────────────────────────────

    public function listDisposals(Request $request): void
    {
        $filters = [
            'disposal_method' => $request->query('disposal_method'),
            'search'          => $request->query('search'),
        ];
        $disposals = $this->disposalModel->getAll(array_filter($filters));
        Response::success($disposals, 'Disposals retrieved');
    }

    public function createDisposal(Request $request): void
    {
        $data = $request->all();

        if (empty($data['asset_code']) || empty($data['condemnation_id'])) {
            Response::validationError(['asset_code and condemnation_id are required']);
            return;
        }

        $condemn = $this->condemnModel->getById($data['condemnation_id']);
        if (!$condemn || $condemn['status'] !== 'approved') {
            Response::error('Condemnation must be approved before disposal', 400);
            return;
        }

        $user = $request->user();
        $data['disposed_by'] = $user['sub'] ?? null;
        $disposal = $this->disposalModel->store($data);

        \App\Core\Database::getInstance()->query("UPDATE assets SET status = 'disposed', updated_at = NOW() WHERE asset_code = ?", [$data['asset_code']]);

        Response::created($disposal, 'Disposal recorded');
    }

    public function disposalStats(Request $request): void
    {
        $stats = $this->disposalModel->getStats();
        Response::success($stats, 'Disposal statistics');
    }
}

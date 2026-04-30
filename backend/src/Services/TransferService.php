<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\Transfer;
use App\Models\ActivityLog;
use App\Core\Database;
use App\Core\Validator;

/**
 * Transfer Service
 */
class TransferService
{
    private $assetModel;
    private $transferModel;
    private $activityLog;
    private $db;

    public function __construct()
    {
        $this->assetModel = new Asset();
        $this->transferModel = new Transfer();
        $this->activityLog = new ActivityLog();
        $this->db = Database::getInstance();
    }

    public function initiate(array $data, ?int $userId = null, ?string $ip = null): array
    {
        $errors = Validator::make($data, [
            'asset_code'       => 'required|string',
            'to_branch_id'     => 'required|integer',
            'to_department_id' => 'required|integer',
            'reason'           => 'nullable|string',
        ]);
        if ($errors) return ['success' => false, 'errors' => $errors];

        $asset = $this->assetModel->findWithDetails($data['asset_code']);
        if (!$asset) return ['success' => false, 'message' => 'Asset not found'];
        if ($asset['status'] === 'in_transfer') return ['success' => false, 'message' => 'Asset is already in transfer'];

        $this->db->beginTransaction();
        try {
            $transferData = [
                'asset_code'       => $data['asset_code'],
                'from_branch_id'   => $asset['branch_id'],
                'from_department_id' => $asset['department_id'],
                'to_branch_id'     => $data['to_branch_id'],
                'to_department_id' => $data['to_department_id'],
                'status'           => 'in_transit',
                'initiated_by'     => $userId,
                'reason'           => $data['reason'] ?? null,
                'notes'            => $data['notes'] ?? null,
            ];
            $transferId = $this->transferModel->create($transferData);
            $this->assetModel->update($data['asset_code'], ['status' => 'in_transfer']);
            $this->activityLog->log($data['asset_code'], 'transferred', $userId,
                ['transfer_id' => $transferId, 'to_branch' => $data['to_branch_id']], $ip);

            $this->db->commit();
            $transfer = $this->transferModel->findWithDetails((int) $transferId);
            return ['success' => true, 'data' => $transfer];
        } catch (\Exception $e) {
            $this->db->rollback();
            return ['success' => false, 'message' => 'Transfer failed: ' . $e->getMessage()];
        }
    }

    public function complete(int $transferId, ?int $userId = null, ?string $ip = null): array
    {
        $transfer = $this->transferModel->findWithDetails($transferId);
        if (!$transfer) return ['success' => false, 'message' => 'Transfer not found'];
        if ($transfer['status'] !== 'in_transit') return ['success' => false, 'message' => 'Transfer is not in transit'];

        $this->db->beginTransaction();
        try {
            $this->transferModel->update($transferId, [
                'status' => 'completed', 'completed_by' => $userId,
                'completed_at' => date('Y-m-d H:i:s'),
            ]);
            $this->assetModel->update($transfer['asset_code'], [
                'branch_id' => $transfer['to_branch_id'],
                'department_id' => $transfer['to_department_id'],
                'status' => 'active',
            ]);
            $this->activityLog->log($transfer['asset_code'], 'transfer_completed', $userId,
                ['transfer_id' => $transferId], $ip);

            $this->db->commit();
            return ['success' => true, 'data' => $this->transferModel->findWithDetails($transferId)];
        } catch (\Exception $e) {
            $this->db->rollback();
            return ['success' => false, 'message' => 'Failed: ' . $e->getMessage()];
        }
    }

    public function cancel(int $transferId, ?int $userId = null, ?string $ip = null): array
    {
        $transfer = $this->transferModel->findWithDetails($transferId);
        if (!$transfer) return ['success' => false, 'message' => 'Transfer not found'];
        if (!in_array($transfer['status'], ['pending', 'in_transit'])) {
            return ['success' => false, 'message' => 'Transfer cannot be cancelled'];
        }

        $this->db->beginTransaction();
        try {
            $this->transferModel->update($transferId, ['status' => 'cancelled']);
            $this->assetModel->update($transfer['asset_code'], ['status' => 'active']);
            $this->activityLog->log($transfer['asset_code'], 'transfer_cancelled', $userId,
                ['transfer_id' => $transferId], $ip);
            $this->db->commit();
            return ['success' => true, 'message' => 'Transfer cancelled'];
        } catch (\Exception $e) {
            $this->db->rollback();
            return ['success' => false, 'message' => 'Failed: ' . $e->getMessage()];
        }
    }

    public function list(array $filters = [], int $page = 1, int $perPage = 20): array
    {
        return $this->transferModel->getPaginated($filters, $page, $perPage);
    }

    public function getById(int $id): ?array
    {
        return $this->transferModel->findWithDetails($id);
    }

    public function getAssetHistory(string $assetCode): array
    {
        return $this->transferModel->getAssetHistory($assetCode);
    }
}

<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\ActivityLog;
use App\Core\Validator;

/**
 * Asset Service
 * 
 * Business logic for CRUD operations on assets.
 */
class AssetService
{
    /** @var Asset */
    private $assetModel;

    /** @var ActivityLog */
    private $activityLog;

    public function __construct()
    {
        $this->assetModel = new Asset();
        $this->activityLog = new ActivityLog();
    }

    /**
     * Create a new asset
     */
    public function create(array $data, ?int $userId = null, ?string $ip = null): array
    {
        // Validate
        $errors = Validator::make($data, [
            'asset_code'    => 'required|string|max:50',
            'name'          => 'required|string|max:200',
            'category_id'   => 'required|integer',
            'branch_id'     => 'required|integer',
            'department_id' => 'required|integer',
            'barcode'       => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'status'        => 'nullable|in:active,inactive,in_transfer,maintenance,disposed,lost',
            'assigned_to'   => 'nullable|string|max:100',
            'warranty_expiry' => 'nullable|date',
            'purchase_date' => 'nullable|date',
            'purchase_cost' => 'nullable|numeric',
            'description'   => 'nullable|string',
            'notes'         => 'nullable|string',
        ]);

        if ($errors) {
            return ['success' => false, 'errors' => $errors];
        }

        // Check asset_code uniqueness
        if ($this->assetModel->find($data['asset_code'])) {
            return ['success' => false, 'message' => 'Asset code already exists'];
        }

        // Check barcode uniqueness
        if (!empty($data['barcode']) && $this->assetModel->exists('barcode', $data['barcode'])) {
            return ['success' => false, 'message' => 'Barcode already exists'];
        }

        // Check serial_number uniqueness
        if (!empty($data['serial_number']) && $this->assetModel->exists('serial_number', $data['serial_number'])) {
            return ['success' => false, 'message' => 'Serial number already exists'];
        }

        // Set defaults
        $data['status'] = $data['status'] ?? 'active';
        $data['is_deleted'] = false;

        // Create asset
        $this->assetModel->create($data);

        // Log activity
        $this->activityLog->log(
            $data['asset_code'],
            'created',
            $userId,
            ['message' => "Asset '{$data['name']}' created"],
            $ip
        );

        // Return the created asset with details
        $asset = $this->assetModel->findWithDetails($data['asset_code']);

        return ['success' => true, 'data' => $asset];
    }

    /**
     * Update an asset
     */
    public function update(string $assetCode, array $data, ?int $userId = null, ?string $ip = null): array
    {
        $existing = $this->assetModel->findWithDetails($assetCode);
        if (!$existing) {
            return ['success' => false, 'message' => 'Asset not found'];
        }

        // Validate
        $errors = Validator::make($data, [
            'name'          => 'nullable|string|max:200',
            'category_id'   => 'nullable|integer',
            'branch_id'     => 'nullable|integer',
            'department_id' => 'nullable|integer',
            'barcode'       => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'status'        => 'nullable|in:active,inactive,in_transfer,maintenance,disposed,lost',
            'assigned_to'   => 'nullable|string|max:100',
            'warranty_expiry' => 'nullable|date',
            'purchase_date' => 'nullable|date',
            'purchase_cost' => 'nullable|numeric',
            'description'   => 'nullable|string',
            'notes'         => 'nullable|string',
        ]);

        if ($errors) {
            return ['success' => false, 'errors' => $errors];
        }

        // Check barcode uniqueness (if changed)
        if (!empty($data['barcode']) && $data['barcode'] !== $existing['barcode']) {
            if ($this->assetModel->exists('barcode', $data['barcode'])) {
                return ['success' => false, 'message' => 'Barcode already in use by another asset'];
            }
        }

        // Check serial_number uniqueness (if changed)
        if (!empty($data['serial_number']) && $data['serial_number'] !== $existing['serial_number']) {
            if ($this->assetModel->exists('serial_number', $data['serial_number'])) {
                return ['success' => false, 'message' => 'Serial number already in use by another asset'];
            }
        }

        // Track changes for logging
        $changes = [];
        foreach ($data as $key => $value) {
            if (isset($existing[$key]) && $existing[$key] != $value) {
                $changes[$key] = ['from' => $existing[$key], 'to' => $value];
            }
        }

        // Update
        $this->assetModel->update($assetCode, $data);

        // Log activity
        if (!empty($changes)) {
            $this->activityLog->log(
                $assetCode,
                'updated',
                $userId,
                ['changes' => $changes],
                $ip
            );
        }

        $asset = $this->assetModel->findWithDetails($assetCode);

        return ['success' => true, 'data' => $asset];
    }

    /**
     * Get asset by code
     */
    public function getByCode(string $assetCode): ?array
    {
        return $this->assetModel->findWithDetails($assetCode);
    }

    /**
     * Get paginated list of assets
     */
    public function list(array $filters = [], int $page = 1, int $perPage = 20): array
    {
        return $this->assetModel->getPaginated($filters, $page, $perPage);
    }

    /**
     * Soft delete an asset
     */
    public function delete(string $assetCode, ?int $userId = null, ?string $ip = null): array
    {
        $asset = $this->assetModel->findWithDetails($assetCode);
        if (!$asset) {
            return ['success' => false, 'message' => 'Asset not found'];
        }

        $this->assetModel->softDelete($assetCode);

        $this->activityLog->log(
            $assetCode,
            'deleted',
            $userId,
            ['message' => "Asset '{$asset['name']}' soft deleted"],
            $ip
        );

        return ['success' => true, 'message' => 'Asset deleted successfully'];
    }
}

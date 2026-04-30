<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\Transfer;
use App\Models\ActivityLog;

/**
 * Tracking Service (CRITICAL MODULE)
 * 
 * Handles material tracking via barcode, serial number, or asset code.
 * Optimized for rapid barcode scanner input.
 */
class TrackingService
{
    /** @var Asset */
    private $assetModel;

    /** @var Transfer */
    private $transferModel;

    /** @var ActivityLog */
    private $activityLog;

    public function __construct()
    {
        $this->assetModel = new Asset();
        $this->transferModel = new Transfer();
        $this->activityLog = new ActivityLog();
    }

    /**
     * Track an asset by type and value
     * 
     * Supports:
     * - barcode: Scan barcode
     * - serial: Serial number lookup
     * - assetCode: Asset code lookup
     * - auto: Auto-detect type (default)
     * 
     * @param string $type Search type
     * @param string $value Search value (trimmed & sanitized)
     * @return array
     */
    public function track(string $type, string $value): array
    {
        // Sanitize: trim whitespace, remove control characters (barcode scanner handling)
        $value = trim(preg_replace('/[\x00-\x1F\x7F]/', '', $value));

        if (empty($value)) {
            return ['success' => false, 'message' => 'Search value is required'];
        }

        // Auto-detect type if not specified
        if ($type === 'auto' || empty($type)) {
            $type = $this->detectType($value);
        }

        // Search based on type
        $asset = null;
        switch ($type) {
            case 'barcode':
                $asset = $this->assetModel->findByBarcode($value);
                break;
            case 'serial':
                $asset = $this->assetModel->findBySerialNumber($value);
                break;
            case 'assetCode':
                $asset = $this->assetModel->findWithDetails($value);
                break;
            default:
                // Try all methods
                $asset = $this->assetModel->findByBarcode($value);
                if (!$asset) {
                    $asset = $this->assetModel->findBySerialNumber($value);
                }
                if (!$asset) {
                    $asset = $this->assetModel->findWithDetails($value);
                }
        }

        if (!$asset) {
            return [
                'success' => false,
                'message' => 'Asset not found',
                'search_type' => $type,
                'search_value' => $value,
            ];
        }

        // Get transfer history
        $transferHistory = $this->transferModel->getAssetHistory($asset['asset_code']);

        // Get activity logs
        $activityLogs = $this->activityLog->getByAsset($asset['asset_code']);

        // Calculate warranty status
        $warrantyStatus = $this->getWarrantyStatus($asset['warranty_expiry']);

        // Build response in the exact format specified
        $response = [
            'asset_code'   => $asset['asset_code'],
            'name'         => $asset['name'],
            'description'  => $asset['description'],
            'category'     => $asset['category_name'],
            'barcode'      => $asset['barcode'],
            'serial_number' => $asset['serial_number'],
            'location'     => [
                'branch'     => $asset['branch_name'],
                'branch_code' => $asset['branch_code'],
                'department' => $asset['department_name'],
                'department_code' => $asset['department_code'],
            ],
            'status'       => $asset['status'],
            'assigned_to'  => $asset['assigned_to'],
            'purchase_date' => $asset['purchase_date'],
            'purchase_cost' => $asset['purchase_cost'],
            'warranty'     => [
                'expiry'         => $asset['warranty_expiry'],
                'status'         => $warrantyStatus['status'],
                'days_remaining' => $warrantyStatus['days_remaining'],
            ],
            'last_updated' => $asset['updated_at'],
            'created_at'   => $asset['created_at'],
            'transfer_history' => array_map(function ($t) {
                return [
                    'id'              => $t['id'],
                    'from_branch'     => $t['from_branch_name'],
                    'from_department' => $t['from_department_name'],
                    'to_branch'       => $t['to_branch_name'],
                    'to_department'   => $t['to_department_name'],
                    'status'          => $t['status'],
                    'reason'          => $t['reason'],
                    'initiated_by'    => $t['initiated_by_name'],
                    'completed_by'    => $t['completed_by_name'],
                    'initiated_at'    => $t['initiated_at'],
                    'completed_at'    => $t['completed_at'],
                ];
            }, $transferHistory),
            'activity_log' => array_slice(array_map(function ($a) {
                return [
                    'action'       => $a['action'],
                    'details'      => json_decode($a['details'] ?? '{}', true),
                    'performed_by' => $a['performed_by_name'],
                    'timestamp'    => $a['created_at'],
                ];
            }, $activityLogs), 0, 20),
        ];

        return ['success' => true, 'data' => $response];
    }

    /**
     * Auto-detect search type based on value pattern
     */
    private function detectType(string $value): string
    {
        // Asset code pattern: starts with AST- or contains specific format
        if (preg_match('/^AST-/i', $value)) {
            return 'assetCode';
        }

        // Barcode pattern: starts with BAR or is purely numeric with 8+ digits
        if (preg_match('/^BAR/i', $value) || preg_match('/^\d{8,}$/', $value)) {
            return 'barcode';
        }

        // Serial number pattern: starts with SN- or contains hyphens
        if (preg_match('/^SN-/i', $value) || preg_match('/^[A-Z]{2,}-[A-Z]+-\d+$/i', $value)) {
            return 'serial';
        }

        // Default: try all methods
        return 'auto';
    }

    /**
     * Calculate warranty status
     */
    private function getWarrantyStatus(?string $warrantyExpiry): array
    {
        if (!$warrantyExpiry) {
            return ['status' => 'no_warranty', 'days_remaining' => null];
        }

        $expiry = new \DateTime($warrantyExpiry);
        $today = new \DateTime('today');
        $diff = $today->diff($expiry);
        $daysRemaining = (int) $diff->format('%r%a');

        if ($daysRemaining < 0) {
            return ['status' => 'expired', 'days_remaining' => $daysRemaining];
        } elseif ($daysRemaining <= 90) {
            return ['status' => 'expiring_soon', 'days_remaining' => $daysRemaining];
        } else {
            return ['status' => 'active', 'days_remaining' => $daysRemaining];
        }
    }
}

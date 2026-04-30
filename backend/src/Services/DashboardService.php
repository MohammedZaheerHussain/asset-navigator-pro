<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\Transfer;
use App\Models\ActivityLog;

/**
 * Dashboard Service
 */
class DashboardService
{
    private $assetModel;
    private $transferModel;
    private $activityLog;

    public function __construct()
    {
        $this->assetModel = new Asset();
        $this->transferModel = new Transfer();
        $this->activityLog = new ActivityLog();
    }

    public function getStats(): array
    {
        return [
            'total_assets'        => $this->assetModel->count(['is_deleted' => false]),
            'active_assets'       => $this->assetModel->count(['is_deleted' => false, 'status' => 'active']),
            'expiring_warranties' => $this->assetModel->countExpiringWarranties(90),
            'assets_in_transfer'  => $this->assetModel->count(['is_deleted' => false, 'status' => 'in_transfer']),
            'maintenance_assets'  => $this->assetModel->count(['is_deleted' => false, 'status' => 'maintenance']),
            'active_transfers'    => $this->transferModel->countActive(),
        ];
    }

    public function getAssetsByCategory(): array
    {
        return $this->assetModel->countByCategory();
    }

    public function getAssetsByBranch(): array
    {
        return $this->assetModel->countByBranch();
    }

    public function getRecentActivity(int $limit = 20): array
    {
        return $this->activityLog->getRecent($limit);
    }

    public function getExpiringWarranties(int $days = 90): array
    {
        return $this->assetModel->getExpiringWarranties($days);
    }
}

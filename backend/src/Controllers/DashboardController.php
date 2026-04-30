<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\DashboardService;

class DashboardController
{
    private $dashboardService;

    public function __construct()
    {
        $this->dashboardService = new DashboardService();
    }

    public function stats(Request $request): void
    {
        Response::success($this->dashboardService->getStats(), 'Dashboard stats');
    }

    public function assetsByCategory(Request $request): void
    {
        Response::success($this->dashboardService->getAssetsByCategory(), 'Assets by category');
    }

    public function assetsByBranch(Request $request): void
    {
        Response::success($this->dashboardService->getAssetsByBranch(), 'Assets by branch');
    }

    public function recentActivity(Request $request): void
    {
        $limit = min((int) ($request->query('limit', 20)), 100);
        Response::success($this->dashboardService->getRecentActivity($limit), 'Recent activity');
    }

    public function expiringWarranties(Request $request): void
    {
        $days = (int) ($request->query('days', 90));
        Response::success($this->dashboardService->getExpiringWarranties($days), 'Expiring warranties');
    }
}

<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\ReportService;

/**
 * ReportController — Multi-User Report CRUD with RBAC
 *
 * Admin: full access to all reports
 * Staff: view/update only their branch reports
 */
class ReportController
{
    private $reportService;

    public function __construct()
    {
        $this->reportService = new ReportService();
    }

    /**
     * GET /api/reports
     * List reports with filters + pagination
     * Staff: auto-filtered to their branch
     */
    public function index(Request $request): void
    {
        $user = $request->user();
        $filters = [
            'report_type'   => $request->query('report_type'),
            'branch_id'     => $request->query('branch_id'),
            'department_id' => $request->query('department_id'),
            'status'        => $request->query('status'),
            'search'        => $request->query('search'),
        ];

        // Staff can only see their branch
        if (($user['role'] ?? '') !== 'admin' && !empty($user['branch_id'])) {
            $filters['branch_id'] = $user['branch_id'];
        }

        $page = max(1, (int)($request->query('page', 1)));
        $perPage = min(max(1, (int)($request->query('per_page', 20))), 100);

        $result = $this->reportService->list(array_filter($filters), $page, $perPage);
        Response::paginated($result['data'], $result['total'], $page, $perPage, 'Reports retrieved');
    }

    /**
     * GET /api/reports/{id}
     * Get single report with details
     */
    public function show(Request $request): void
    {
        $id = (int)$request->param('id');
        $report = $this->reportService->getById($id);

        if (!$report) {
            Response::notFound('Report not found');
            return;
        }

        // Staff: check branch access
        $user = $request->user();
        if (($user['role'] ?? '') !== 'admin' && !empty($user['branch_id'])) {
            if ((int)$report['branch_id'] !== (int)$user['branch_id']) {
                Response::forbidden('Access denied: report belongs to another branch');
                return;
            }
        }

        Response::success($report, 'Report retrieved');
    }

    /**
     * POST /api/reports
     * Create new report (Admin only)
     */
    public function store(Request $request): void
    {
        $user = $request->user();
        $result = $this->reportService->create(
            $request->all(),
            $user['sub'] ?? null,
            $request->ip()
        );

        if ($result['success']) {
            Response::created($result['data'], 'Report created successfully');
        } else {
            if (isset($result['errors'])) {
                Response::validationError($result['errors']);
            } else {
                Response::error($result['message'] ?? 'Failed to create report', 400);
            }
        }
    }

    /**
     * PUT /api/reports/{id}
     * Update report with optimistic locking
     * Staff: can only update their branch reports
     */
    public function update(Request $request): void
    {
        $id = (int)$request->param('id');
        $user = $request->user();

        // Staff: check branch access before update
        if (($user['role'] ?? '') !== 'admin' && !empty($user['branch_id'])) {
            $report = $this->reportService->getById($id);
            if (!$report) {
                Response::notFound('Report not found');
                return;
            }
            if ((int)$report['branch_id'] !== (int)$user['branch_id']) {
                Response::forbidden('Access denied: you can only update reports in your branch');
                return;
            }
        }

        $result = $this->reportService->update(
            $id,
            $request->all(),
            $user['sub'] ?? null,
            $request->ip()
        );

        if ($result['success']) {
            Response::success($result['data'], 'Report updated successfully');
        } else {
            if (isset($result['conflict']) && $result['conflict']) {
                Response::error($result['message'], 409); // Conflict
            } elseif (isset($result['errors'])) {
                Response::validationError($result['errors']);
            } else {
                Response::error($result['message'] ?? 'Failed to update report', 400);
            }
        }
    }

    /**
     * DELETE /api/reports/{id}
     * Archive report (Admin only — soft delete)
     */
    public function destroy(Request $request): void
    {
        $id = (int)$request->param('id');
        $user = $request->user();

        $result = $this->reportService->archive(
            $id,
            $user['sub'] ?? null,
            $request->ip()
        );

        if ($result['success']) {
            Response::success(null, $result['message']);
        } else {
            Response::notFound($result['message']);
        }
    }

    /**
     * GET /api/reports/{id}/history
     * Get full update history for a report
     */
    public function history(Request $request): void
    {
        $id = (int)$request->param('id');

        // Verify report exists
        $report = $this->reportService->getById($id);
        if (!$report) {
            Response::notFound('Report not found');
            return;
        }

        // Staff: check branch access
        $user = $request->user();
        if (($user['role'] ?? '') !== 'admin' && !empty($user['branch_id'])) {
            if ((int)$report['branch_id'] !== (int)$user['branch_id']) {
                Response::forbidden('Access denied');
                return;
            }
        }

        $limit = min(max(1, (int)($request->query('limit', 50))), 100);
        $history = $this->reportService->getHistory($id, $limit);

        Response::success([
            'report'  => $report,
            'history' => $history,
        ], 'Report history retrieved');
    }
}

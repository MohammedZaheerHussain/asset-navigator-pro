<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\AssetService;

class AssetController
{
    private $assetService;

    public function __construct()
    {
        $this->assetService = new AssetService();
    }

    public function index(Request $request): void
    {
        $filters = [
            'status'        => $request->query('status'),
            'category_id'   => $request->query('category_id'),
            'branch_id'     => $request->query('branch_id'),
            'department_id' => $request->query('department_id'),
            'search'        => $request->query('search'),
        ];
        $page = (int) ($request->query('page', 1));
        $perPage = min((int) ($request->query('per_page', 20)), 100);

        $result = $this->assetService->list(array_filter($filters), $page, $perPage);
        Response::paginated($result['data'], $result['total'], $page, $perPage, 'Assets retrieved');
    }

    public function show(Request $request): void
    {
        $asset = $this->assetService->getByCode($request->param('code'));
        if ($asset) {
            Response::success($asset);
        } else {
            Response::notFound('Asset not found');
        }
    }

    public function store(Request $request): void
    {
        $user = $request->user();
        $result = $this->assetService->create(
            $request->all(),
            $user['sub'] ?? null,
            $request->ip()
        );

        if ($result['success']) {
            Response::created($result['data'], 'Asset created successfully');
        } else {
            if (isset($result['errors'])) {
                Response::validationError($result['errors']);
            } else {
                Response::error($result['message'], 409);
            }
        }
    }

    public function update(Request $request): void
    {
        $user = $request->user();
        $result = $this->assetService->update(
            $request->param('code'),
            $request->all(),
            $user['sub'] ?? null,
            $request->ip()
        );

        if ($result['success']) {
            Response::success($result['data'], 'Asset updated successfully');
        } else {
            if (isset($result['errors'])) {
                Response::validationError($result['errors']);
            } else {
                Response::error($result['message'], $result['message'] === 'Asset not found' ? 404 : 409);
            }
        }
    }

    public function destroy(Request $request): void
    {
        $user = $request->user();
        $result = $this->assetService->delete(
            $request->param('code'),
            $user['sub'] ?? null,
            $request->ip()
        );

        if ($result['success']) {
            Response::success(null, $result['message']);
        } else {
            Response::notFound($result['message']);
        }
    }
}

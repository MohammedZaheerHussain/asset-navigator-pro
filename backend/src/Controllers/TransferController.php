<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\TransferService;

class TransferController
{
    private $transferService;

    public function __construct()
    {
        $this->transferService = new TransferService();
    }

    public function index(Request $request): void
    {
        $filters = [
            'status'     => $request->query('status'),
            'asset_code' => $request->query('asset_code'),
        ];
        $page = (int) ($request->query('page', 1));
        $perPage = min((int) ($request->query('per_page', 20)), 100);

        $result = $this->transferService->list(array_filter($filters), $page, $perPage);
        Response::paginated($result['data'], $result['total'], $page, $perPage, 'Transfers retrieved');
    }

    public function show(Request $request): void
    {
        $transfer = $this->transferService->getById((int) $request->param('id'));
        if ($transfer) {
            Response::success($transfer);
        } else {
            Response::notFound('Transfer not found');
        }
    }

    public function store(Request $request): void
    {
        $user = $request->user();
        $result = $this->transferService->initiate($request->all(), $user['sub'] ?? null, $request->ip());

        if ($result['success']) {
            Response::created($result['data'], 'Transfer initiated');
        } else {
            if (isset($result['errors'])) {
                Response::validationError($result['errors']);
            } else {
                Response::error($result['message']);
            }
        }
    }

    public function complete(Request $request): void
    {
        $user = $request->user();
        $result = $this->transferService->complete((int) $request->param('id'), $user['sub'] ?? null, $request->ip());

        if ($result['success']) {
            Response::success($result['data'], 'Transfer completed');
        } else {
            Response::error($result['message']);
        }
    }

    public function cancel(Request $request): void
    {
        $user = $request->user();
        $result = $this->transferService->cancel((int) $request->param('id'), $user['sub'] ?? null, $request->ip());

        if ($result['success']) {
            Response::success(null, $result['message']);
        } else {
            Response::error($result['message']);
        }
    }

    public function assetHistory(Request $request): void
    {
        $history = $this->transferService->getAssetHistory($request->param('code'));
        Response::success($history, 'Transfer history');
    }
}

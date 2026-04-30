<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\Branch;

class BranchController
{
    private $branchModel;

    public function __construct()
    {
        $this->branchModel = new Branch();
    }

    public function index(Request $request): void
    {
        $branches = $this->branchModel->getWithDepartmentCount();
        Response::success($branches, 'Branches retrieved');
    }

    public function show(Request $request): void
    {
        $branch = $this->branchModel->find((int) $request->param('id'));
        if ($branch) {
            Response::success($branch);
        } else {
            Response::notFound('Branch not found');
        }
    }

    public function store(Request $request): void
    {
        $errors = Validator::make($request->all(), [
            'name'  => 'required|string|max:100',
            'code'  => 'required|string|max:20',
            'address' => 'nullable|string',
            'city'  => 'nullable|string|max:50',
            'state' => 'nullable|string|max:50',
            'contact_phone' => 'nullable|string|max:20',
            'contact_email' => 'nullable|email',
        ]);
        if ($errors) { Response::validationError($errors); return; }

        if ($this->branchModel->findByCode($request->input('code'))) {
            Response::error('Branch code already exists', 409);
            return;
        }

        $id = $this->branchModel->create($request->only([
            'name', 'code', 'address', 'city', 'state', 'contact_phone', 'contact_email'
        ]));
        $branch = $this->branchModel->find((int) $id);
        Response::created($branch, 'Branch created');
    }

    public function update(Request $request): void
    {
        $id = (int) $request->param('id');
        $existing = $this->branchModel->find($id);
        if (!$existing) { Response::notFound('Branch not found'); return; }

        $this->branchModel->update($id, $request->only([
            'name', 'code', 'address', 'city', 'state', 'contact_phone', 'contact_email'
        ]));
        Response::success($this->branchModel->find($id), 'Branch updated');
    }
}

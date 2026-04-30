<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\Department;

class DepartmentController
{
    private $departmentModel;

    public function __construct()
    {
        $this->departmentModel = new Department();
    }

    public function index(Request $request): void
    {
        $branchId = $request->query('branch_id');
        if ($branchId) {
            $departments = $this->departmentModel->getByBranch((int) $branchId);
        } else {
            $departments = $this->departmentModel->getActive();
        }
        Response::success($departments, 'Departments retrieved');
    }

    public function show(Request $request): void
    {
        $dept = $this->departmentModel->find((int) $request->param('id'));
        if ($dept) {
            Response::success($dept);
        } else {
            Response::notFound('Department not found');
        }
    }

    public function store(Request $request): void
    {
        $errors = Validator::make($request->all(), [
            'name'      => 'required|string|max:100',
            'code'      => 'required|string|max:20',
            'branch_id' => 'required|integer',
            'head_name' => 'nullable|string|max:100',
        ]);
        if ($errors) { Response::validationError($errors); return; }

        if ($this->departmentModel->findByCode($request->input('code'))) {
            Response::error('Department code already exists', 409);
            return;
        }

        $id = $this->departmentModel->create($request->only(['name', 'code', 'branch_id', 'head_name']));
        $dept = $this->departmentModel->find((int) $id);
        Response::created($dept, 'Department created');
    }

    public function update(Request $request): void
    {
        $id = (int) $request->param('id');
        $existing = $this->departmentModel->find($id);
        if (!$existing) { Response::notFound('Department not found'); return; }

        $this->departmentModel->update($id, $request->only(['name', 'code', 'branch_id', 'head_name']));
        Response::success($this->departmentModel->find($id), 'Department updated');
    }
}

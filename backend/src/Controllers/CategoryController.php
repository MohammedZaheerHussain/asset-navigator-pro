<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\Category;

class CategoryController
{
    private $categoryModel;

    public function __construct()
    {
        $this->categoryModel = new Category();
    }

    public function index(Request $request): void
    {
        $categories = $this->categoryModel->getActive();
        Response::success($categories, 'Categories retrieved');
    }

    public function store(Request $request): void
    {
        $errors = Validator::make($request->all(), [
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);
        if ($errors) { Response::validationError($errors); return; }

        if ($this->categoryModel->findByName($request->input('name'))) {
            Response::error('Category already exists', 409);
            return;
        }

        $id = $this->categoryModel->create($request->only(['name', 'description']));
        $category = $this->categoryModel->find((int) $id);
        Response::created($category, 'Category created');
    }

    public function update(Request $request): void
    {
        $id = (int) $request->param('id');
        $existing = $this->categoryModel->find($id);
        if (!$existing) { Response::notFound('Category not found'); return; }

        $this->categoryModel->update($id, $request->only(['name', 'description']));
        Response::success($this->categoryModel->find($id), 'Category updated');
    }
}

<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Services\UserService;

/**
 * User Controller
 * 
 * Full CRUD for user management (Admin only).
 */
class UserController
{
    private $userService;

    public function __construct()
    {
        $this->userService = new UserService();
    }

    /**
     * GET /api/users — List all users (paginated)
     */
    public function index(Request $request): void
    {
        $result = $this->userService->list($request->all());

        Response::paginated(
            $result['data'],
            $result['total'],
            $result['page'],
            $result['per_page'],
            'Users retrieved'
        );
    }

    /**
     * GET /api/users/{id} — Get single user
     */
    public function show(Request $request): void
    {
        $id = (int) $request->param('id');
        $user = $this->userService->getById($id);

        if (!$user) {
            Response::notFound('User not found');
            return;
        }

        Response::success($user);
    }

    /**
     * POST /api/users — Create new user
     */
    public function store(Request $request): void
    {
        $errors = Validator::make($request->all(), [
            'username'  => 'required|string|min:3|max:50',
            'email'     => 'required|email',
            'password'  => 'required|string|min:6',
            'full_name' => 'required|string|max:100',
            'role'      => 'required|in:admin,staff',
            'phone'     => 'nullable|string|max:20',
        ]);
        if ($errors) { Response::validationError($errors); return; }

        $result = $this->userService->create($request->all());

        if ($result['success']) {
            Response::created($result['data'], 'User created successfully');
        } else {
            Response::error($result['message'], 409);
        }
    }

    /**
     * PUT /api/users/{id} — Update user
     */
    public function update(Request $request): void
    {
        $id = (int) $request->param('id');

        $errors = Validator::make($request->all(), [
            'username'  => 'nullable|string|min:3|max:50',
            'email'     => 'nullable|email',
            'password'  => 'nullable|string|min:6',
            'full_name' => 'nullable|string|max:100',
            'role'      => 'nullable|in:admin,staff',
            'phone'     => 'nullable|string|max:20',
        ]);
        if ($errors) { Response::validationError($errors); return; }

        $result = $this->userService->update($id, $request->all());

        if ($result['success']) {
            Response::success($result['data'], 'User updated successfully');
        } else {
            $code = $result['code'] ?? 400;
            Response::error($result['message'], $code);
        }
    }

    /**
     * DELETE /api/users/{id} — Soft delete (deactivate) user
     */
    public function destroy(Request $request): void
    {
        $id = (int) $request->param('id');
        $currentUserId = $request->user()['sub'] ?? 0;

        $result = $this->userService->delete($id, $currentUserId);

        if ($result['success']) {
            Response::success(null, 'User deactivated successfully');
        } else {
            $code = $result['code'] ?? 400;
            Response::error($result['message'], $code);
        }
    }

    /**
     * PATCH /api/users/{id}/status — Activate/Deactivate user
     */
    public function toggleStatus(Request $request): void
    {
        $id = (int) $request->param('id');
        $currentUserId = $request->user()['sub'] ?? 0;

        $errors = Validator::make($request->all(), [
            'status' => 'required|in:active,inactive',
        ]);
        if ($errors) { Response::validationError($errors); return; }

        $result = $this->userService->toggleStatus($id, $request->input('status'), $currentUserId);

        if ($result['success']) {
            Response::success($result['data'], 'User status updated');
        } else {
            $code = $result['code'] ?? 400;
            Response::error($result['message'], $code);
        }
    }
}

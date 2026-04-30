<?php

namespace App\Services;

use App\Models\User;

/**
 * User Service
 * 
 * Handles user CRUD operations with validation and security.
 */
class UserService
{
    /** @var User */
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    /**
     * List all users with pagination and filtering
     */
    public function list(array $params): array
    {
        $page = max(1, (int) ($params['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($params['per_page'] ?? 20)));

        $filters = [];
        if (!empty($params['role'])) $filters['role'] = $params['role'];
        if (!empty($params['status'])) $filters['status'] = $params['status'];
        if (!empty($params['search'])) $filters['search'] = $params['search'];

        return $this->userModel->getAllPaginated($page, $perPage, $filters);
    }

    /**
     * Get a single user by ID
     */
    public function getById(int $id): ?array
    {
        return $this->userModel->findSafe($id);
    }

    /**
     * Create a new user
     */
    public function create(array $data): array
    {
        // Check uniqueness
        if ($this->userModel->usernameExists($data['username'])) {
            return ['success' => false, 'message' => 'Username already exists'];
        }
        if ($this->userModel->emailExists($data['email'])) {
            return ['success' => false, 'message' => 'Email already exists'];
        }

        // Hash password
        $insertData = [
            'username'      => trim($data['username']),
            'email'         => trim(strtolower($data['email'])),
            'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
            'full_name'     => trim($data['full_name']),
            'role'          => $data['role'] ?? 'staff',
            'phone'         => isset($data['phone']) ? trim($data['phone']) : null,
            'is_active'     => true,
        ];

        $userId = $this->userModel->create($insertData);
        $user = $this->userModel->findSafe((int) $userId);

        return ['success' => true, 'data' => $user];
    }

    /**
     * Update an existing user
     */
    public function update(int $id, array $data): array
    {
        $existing = $this->userModel->findSafe($id);
        if (!$existing) {
            return ['success' => false, 'message' => 'User not found', 'code' => 404];
        }

        // Check uniqueness (excluding current user)
        if (!empty($data['username']) && $this->userModel->usernameExists($data['username'], $id)) {
            return ['success' => false, 'message' => 'Username already taken'];
        }
        if (!empty($data['email']) && $this->userModel->emailExists($data['email'], $id)) {
            return ['success' => false, 'message' => 'Email already taken'];
        }

        $updateData = [];
        if (!empty($data['username']))  $updateData['username']  = trim($data['username']);
        if (!empty($data['email']))     $updateData['email']     = trim(strtolower($data['email']));
        if (!empty($data['full_name'])) $updateData['full_name'] = trim($data['full_name']);
        if (!empty($data['role']))      $updateData['role']      = $data['role'];
        if (isset($data['phone']))      $updateData['phone']     = trim($data['phone']) ?: null;

        // Password change (optional)
        if (!empty($data['password'])) {
            $updateData['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        if (!empty($updateData)) {
            $this->userModel->update($id, $updateData);
        }

        $user = $this->userModel->findSafe($id);
        return ['success' => true, 'data' => $user];
    }

    /**
     * Soft-delete (deactivate) a user
     */
    public function delete(int $id, int $currentUserId): array
    {
        if ($id === $currentUserId) {
            return ['success' => false, 'message' => 'You cannot deactivate your own account'];
        }

        $existing = $this->userModel->findSafe($id);
        if (!$existing) {
            return ['success' => false, 'message' => 'User not found', 'code' => 404];
        }

        $this->userModel->deactivate($id);
        return ['success' => true, 'data' => null];
    }

    /**
     * Toggle user status (activate/deactivate)
     */
    public function toggleStatus(int $id, string $status, int $currentUserId): array
    {
        if ($id === $currentUserId) {
            return ['success' => false, 'message' => 'You cannot change your own status'];
        }

        $existing = $this->userModel->findSafe($id);
        if (!$existing) {
            return ['success' => false, 'message' => 'User not found', 'code' => 404];
        }

        if ($status === 'active') {
            $this->userModel->activate($id);
        } else {
            $this->userModel->deactivate($id);
        }

        $user = $this->userModel->findSafe($id);
        return ['success' => true, 'data' => $user];
    }
}

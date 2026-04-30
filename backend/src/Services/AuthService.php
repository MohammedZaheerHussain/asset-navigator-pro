<?php

namespace App\Services;

use App\Models\User;
use App\Core\Response;
use Firebase\JWT\JWT;

/**
 * Authentication Service
 * 
 * Handles user login, registration, and JWT token management.
 */
class AuthService
{
    /** @var User */
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    /**
     * Authenticate user and return JWT token
     */
    public function login(string $username, string $password): array
    {
        // Find user by username or email
        $user = $this->userModel->findByUsername($username);
        if (!$user) {
            $user = $this->userModel->findByEmail($username);
        }

        if (!$user) {
            return ['success' => false, 'message' => 'Invalid credentials'];
        }

        if (!$user['is_active']) {
            return ['success' => false, 'message' => 'Account is deactivated'];
        }

        if (!password_verify($password, $user['password_hash'])) {
            return ['success' => false, 'message' => 'Invalid credentials'];
        }

        // Update last login
        $this->userModel->updateLastLogin($user['id']);

        // Generate JWT token
        $token = $this->generateToken($user);

        return [
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => [
                    'id'        => $user['id'],
                    'username'  => $user['username'],
                    'email'     => $user['email'],
                    'full_name' => $user['full_name'],
                    'role'      => $user['role'],
                ],
            ],
        ];
    }

    /**
     * Register a new user (admin only)
     */
    public function register(array $data): array
    {
        // Check if username already exists
        if ($this->userModel->findByUsername($data['username'])) {
            return ['success' => false, 'message' => 'Username already exists'];
        }

        // Check if email already exists
        if ($this->userModel->findByEmail($data['email'])) {
            return ['success' => false, 'message' => 'Email already exists'];
        }

        // Hash password
        $data['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
        unset($data['password']);

        // Create user
        $userId = $this->userModel->create($data);

        $user = $this->userModel->findSafe((int) $userId);

        return [
            'success' => true,
            'data' => $user,
        ];
    }

    /**
     * Generate JWT token for a user
     */
    private function generateToken(array $user): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'default-secret';
        $expiry = (int) ($_ENV['JWT_EXPIRY'] ?? 3600);

        $payload = [
            'iss' => $_ENV['APP_URL'] ?? 'http://localhost:8000',
            'iat' => time(),
            'exp' => time() + $expiry,
            'sub' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }

    /**
     * Get user profile
     */
    public function getProfile(int $userId): ?array
    {
        return $this->userModel->findSafe($userId);
    }
}

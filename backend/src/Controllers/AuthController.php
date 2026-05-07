<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;
use App\Core\Validator;

class AuthController
{
    private $authService;

    public function __construct()
    {
        $this->authService = new AuthService();
    }

    public function login(Request $request): void
    {
        $errors = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string|min:6',
        ]);
        if ($errors) { Response::validationError($errors); return; }

        $result = $this->authService->login(
            $request->input('username'),
            $request->input('password')
        );

        if ($result['success']) {
            Response::success($result['data'], 'Login successful');
        } else {
            Response::unauthorized($result['message']);
        }
    }

    public function register(Request $request): void
    {
        $errors = Validator::make($request->all(), [
            'username'  => 'required|string|min:3|max:50',
            'email'     => 'required|email',
            'password'  => 'required|string|min:6',
            'full_name' => 'required|string|max:100',
            'role'      => 'required|in:admin,staff',
        ]);
        if ($errors) { Response::validationError($errors); return; }

        $result = $this->authService->register($request->all());

        if ($result['success']) {
            Response::created($result['data'], 'User registered successfully');
        } else {
            Response::error($result['message'], 409);
        }
    }

    public function profile(Request $request): void
    {
        $user = $request->user();
        $profile = $this->authService->getProfile($user['sub']);
        if ($profile) {
            Response::success($profile);
        } else {
            Response::notFound('User not found');
        }
    }

    public function updateProfile(Request $request): void
    {
        $user = $request->user();
        $errors = Validator::make($request->all(), [
            'full_name' => 'nullable|string|max:100',
            'email'     => 'nullable|email',
            'phone'     => 'nullable|string|max:20',
        ]);
        if ($errors) { Response::validationError($errors); return; }

        $result = $this->authService->updateProfile($user['sub'], $request->all());
        if ($result['success']) {
            Response::success($result['data'], 'Profile updated successfully');
        } else {
            Response::error($result['message'], 400);
        }
    }

    public function changePassword(Request $request): void
    {
        $user = $request->user();
        $errors = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:6',
        ]);
        if ($errors) { Response::validationError($errors); return; }

        $result = $this->authService->changePassword(
            $user['sub'],
            $request->input('current_password'),
            $request->input('new_password')
        );
        if ($result['success']) {
            Response::success(null, 'Password changed successfully');
        } else {
            Response::error($result['message'], 400);
        }
    }
}

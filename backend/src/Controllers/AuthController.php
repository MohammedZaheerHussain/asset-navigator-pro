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
}

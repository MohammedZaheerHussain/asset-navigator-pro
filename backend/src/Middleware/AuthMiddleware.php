<?php

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * Authentication Middleware
 * 
 * Validates JWT tokens from the Authorization header.
 * Sets the authenticated user data on the request object.
 */
class AuthMiddleware
{
    public function handle(Request $request): void
    {
        $token = $request->bearerToken();

        if (!$token) {
            Response::unauthorized('No authentication token provided');
        }

        try {
            $secret = $_ENV['JWT_SECRET'] ?? 'default-secret';
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            $userData = (array) $decoded;

            $request->setUser($userData);
        } catch (\Firebase\JWT\ExpiredException $e) {
            Response::unauthorized('Token has expired');
        } catch (\Firebase\JWT\SignatureInvalidException $e) {
            Response::unauthorized('Invalid token signature');
        } catch (\Exception $e) {
            Response::unauthorized('Invalid authentication token');
        }
    }
}

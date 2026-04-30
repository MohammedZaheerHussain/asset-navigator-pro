<?php

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;

/**
 * CORS Middleware
 * 
 * Handles Cross-Origin Resource Sharing headers for frontend-backend communication.
 */
class CorsMiddleware
{
    public function handle(Request $request): void
    {
        $allowedOrigins = array_map('trim', explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? '*'));
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        // Check if origin is allowed
        if (in_array('*', $allowedOrigins) || in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
        }

        header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 86400");

        // Handle preflight OPTIONS request
        if ($request->getMethod() === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}

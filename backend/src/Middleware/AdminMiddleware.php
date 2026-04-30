<?php

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;

/**
 * Admin Role Middleware
 * 
 * Ensures the authenticated user has admin privileges.
 * Must be used AFTER AuthMiddleware in the middleware chain.
 */
class AdminMiddleware
{
    public function handle(Request $request): void
    {
        $user = $request->user();

        if (!$user) {
            Response::unauthorized('Authentication required');
        }

        if (($user['role'] ?? '') !== 'admin') {
            Response::forbidden('Admin access required');
        }
    }
}

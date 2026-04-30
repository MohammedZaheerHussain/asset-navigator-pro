<?php

namespace App\Core;

/**
 * HTTP Response Builder
 * 
 * Provides standardized JSON API responses with consistent structure.
 */
class Response
{
    /**
     * Send a successful JSON response
     */
    public static function success($data = null, string $message = 'Success', int $statusCode = 200): void
    {
        self::send([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $statusCode);
    }

    /**
     * Send an error JSON response
     */
    public static function error(string $message = 'Error', int $statusCode = 400, $errors = null): void
    {
        $response = [
            'success'    => false,
            'message'    => $message,
            'error_code' => $statusCode,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        self::send($response, $statusCode);
    }

    /**
     * Send a paginated response
     */
    public static function paginated(array $data, int $total, int $page, int $perPage, string $message = 'Success'): void
    {
        self::send([
            'success' => true,
            'message' => $message,
            'data'    => $data,
            'pagination' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
                'from'         => ($page - 1) * $perPage + 1,
                'to'           => min($page * $perPage, $total),
            ],
        ], 200);
    }

    /**
     * Send a 201 Created response
     */
    public static function created($data = null, string $message = 'Created successfully'): void
    {
        self::success($data, $message, 201);
    }

    /**
     * Send a 204 No Content response
     */
    public static function noContent(): void
    {
        http_response_code(204);
        exit;
    }

    /**
     * Send a 404 Not Found response
     */
    public static function notFound(string $message = 'Resource not found'): void
    {
        self::error($message, 404);
    }

    /**
     * Send a 401 Unauthorized response
     */
    public static function unauthorized(string $message = 'Unauthorized'): void
    {
        self::error($message, 401);
    }

    /**
     * Send a 403 Forbidden response
     */
    public static function forbidden(string $message = 'Forbidden'): void
    {
        self::error($message, 403);
    }

    /**
     * Send a 422 Validation Error response
     */
    public static function validationError(array $errors, string $message = 'Validation failed'): void
    {
        self::error($message, 422, $errors);
    }

    /**
     * Internal: Send JSON response and terminate
     */
    private static function send(array $payload, int $statusCode): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

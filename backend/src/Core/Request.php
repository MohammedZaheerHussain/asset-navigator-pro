<?php

namespace App\Core;

/**
 * HTTP Request Handler
 * 
 * Parses and provides access to the current HTTP request data
 * including headers, query params, body, and route params.
 */
class Request
{
    /** @var string */
    private $method;

    /** @var string */
    private $uri;

    /** @var string */
    private $path;

    /** @var array */
    private $queryParams;

    /** @var array */
    private $body;

    /** @var array */
    private $headers;

    /** @var array Route parameters set by the router */
    private $routeParams = [];

    /** @var array Authenticated user data */
    private $user = null;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $this->uri = $_SERVER['REQUEST_URI'] ?? '/';
        $this->path = $this->parsePath();
        $this->queryParams = $_GET;
        $this->body = $this->parseBody();
        $this->headers = $this->parseHeaders();
    }

    /**
     * Parse the request path (without query string)
     */
    private function parsePath(): string
    {
        $path = parse_url($this->uri, PHP_URL_PATH);
        return rtrim($path, '/') ?: '/';
    }

    /**
     * Parse the request body (JSON or form data)
     */
    private function parseBody(): array
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (strpos($contentType, 'application/json') !== false) {
            $raw = file_get_contents('php://input');
            $decoded = json_decode($raw, true);
            return is_array($decoded) ? $decoded : [];
        }

        return $_POST;
    }

    /**
     * Parse request headers
     */
    private function parseHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0) {
                $headerName = str_replace('_', '-', strtolower(substr($key, 5)));
                $headers[$headerName] = $value;
            }
        }
        // Also capture Content-Type and Authorization directly
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
        }
        return $headers;
    }

    /**
     * Get HTTP method
     */
    public function getMethod(): string
    {
        return $this->method;
    }

    /**
     * Get request path
     */
    public function getPath(): string
    {
        return $this->path;
    }

    /**
     * Get query parameter
     */
    public function query(string $key, $default = null)
    {
        return $this->queryParams[$key] ?? $default;
    }

    /**
     * Get all query parameters
     */
    public function allQuery(): array
    {
        return $this->queryParams;
    }

    /**
     * Get body parameter
     */
    public function input(string $key, $default = null)
    {
        return $this->body[$key] ?? $default;
    }

    /**
     * Get all body parameters
     */
    public function all(): array
    {
        return $this->body;
    }

    /**
     * Get specific body fields only
     */
    public function only(array $keys): array
    {
        return array_intersect_key($this->body, array_flip($keys));
    }

    /**
     * Check if body has a key
     */
    public function has(string $key): bool
    {
        return array_key_exists($key, $this->body);
    }

    /**
     * Get header value
     */
    public function header(string $key, $default = null): ?string
    {
        $key = strtolower($key);
        return $this->headers[$key] ?? $default;
    }

    /**
     * Get Bearer token from Authorization header
     */
    public function bearerToken(): ?string
    {
        $auth = $this->header('authorization');
        if ($auth && preg_match('/Bearer\s+(.+)/i', $auth, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Set route parameters (called by Router)
     */
    public function setRouteParams(array $params): void
    {
        $this->routeParams = $params;
    }

    /**
     * Get a route parameter
     */
    public function param(string $key, $default = null)
    {
        return $this->routeParams[$key] ?? $default;
    }

    /**
     * Get all route parameters
     */
    public function params(): array
    {
        return $this->routeParams;
    }

    /**
     * Set authenticated user data
     */
    public function setUser(array $user): void
    {
        $this->user = $user;
    }

    /**
     * Get authenticated user data
     */
    public function user(): ?array
    {
        return $this->user;
    }

    /**
     * Get client IP address
     */
    public function ip(): string
    {
        return $_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['HTTP_CLIENT_IP']
            ?? $_SERVER['REMOTE_ADDR']
            ?? '0.0.0.0';
    }
}

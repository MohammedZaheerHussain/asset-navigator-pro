<?php

namespace App\Core;

/**
 * HTTP Router
 * 
 * Simple but powerful router supporting:
 * - RESTful methods (GET, POST, PUT, DELETE, PATCH)
 * - Named route parameters ({param})
 * - Route grouping with prefix
 * - Middleware support
 */
class Router
{
    /** @var array Registered routes */
    private $routes = [];

    /** @var string Current group prefix */
    private $groupPrefix = '';

    /** @var array Current group middleware */
    private $groupMiddleware = [];

    /**
     * Register a GET route
     */
    public function get(string $path, $handler, array $middleware = []): self
    {
        return $this->addRoute('GET', $path, $handler, $middleware);
    }

    /**
     * Register a POST route
     */
    public function post(string $path, $handler, array $middleware = []): self
    {
        return $this->addRoute('POST', $path, $handler, $middleware);
    }

    /**
     * Register a PUT route
     */
    public function put(string $path, $handler, array $middleware = []): self
    {
        return $this->addRoute('PUT', $path, $handler, $middleware);
    }

    /**
     * Register a DELETE route
     */
    public function delete(string $path, $handler, array $middleware = []): self
    {
        return $this->addRoute('DELETE', $path, $handler, $middleware);
    }

    /**
     * Register a PATCH route
     */
    public function patch(string $path, $handler, array $middleware = []): self
    {
        return $this->addRoute('PATCH', $path, $handler, $middleware);
    }

    /**
     * Group routes with a common prefix and middleware
     */
    public function group(string $prefix, array $middleware, callable $callback): void
    {
        $previousPrefix = $this->groupPrefix;
        $previousMiddleware = $this->groupMiddleware;

        $this->groupPrefix = $previousPrefix . $prefix;
        $this->groupMiddleware = array_merge($previousMiddleware, $middleware);

        $callback($this);

        $this->groupPrefix = $previousPrefix;
        $this->groupMiddleware = $previousMiddleware;
    }

    /**
     * Add a route to the registry
     */
    private function addRoute(string $method, string $path, $handler, array $middleware = []): self
    {
        $fullPath = $this->groupPrefix . $path;
        $fullPath = rtrim($fullPath, '/') ?: '/';

        $this->routes[] = [
            'method'     => $method,
            'path'       => $fullPath,
            'handler'    => $handler,
            'middleware'  => array_merge($this->groupMiddleware, $middleware),
            'pattern'    => $this->buildPattern($fullPath),
            'paramNames' => $this->extractParamNames($fullPath),
        ];

        return $this;
    }

    /**
     * Build a regex pattern from a route path
     */
    private function buildPattern(string $path): string
    {
        // Replace {param} with named capture groups
        $pattern = preg_replace('/\{([a-zA-Z_]+)\}/', '([^/]+)', $path);
        return '#^' . $pattern . '$#';
    }

    /**
     * Extract parameter names from a route path
     */
    private function extractParamNames(string $path): array
    {
        preg_match_all('/\{([a-zA-Z_]+)\}/', $path, $matches);
        return $matches[1] ?? [];
    }

    /**
     * Resolve the current request to a route and execute it
     */
    public function resolve(Request $request): void
    {
        $method = $request->getMethod();
        $path = $request->getPath();

        // Handle CORS preflight
        if ($method === 'OPTIONS') {
            Response::noContent();
            return;
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (preg_match($route['pattern'], $path, $matches)) {
                // Extract route parameters
                array_shift($matches); // Remove full match
                $params = [];
                foreach ($route['paramNames'] as $index => $name) {
                    $params[$name] = $matches[$index] ?? null;
                }
                $request->setRouteParams($params);

                // Execute middleware chain
                $this->executeMiddleware($route['middleware'], $request);

                // Execute handler
                $this->executeHandler($route['handler'], $request);
                return;
            }
        }

        // No route matched
        Response::notFound('Endpoint not found: ' . $method . ' ' . $path);
    }

    /**
     * Execute middleware stack
     */
    private function executeMiddleware(array $middleware, Request $request): void
    {
        foreach ($middleware as $mw) {
            if (is_string($mw) && class_exists($mw)) {
                $instance = new $mw();
                if (method_exists($instance, 'handle')) {
                    $instance->handle($request);
                }
            } elseif (is_callable($mw)) {
                $mw($request);
            }
        }
    }

    /**
     * Execute the route handler
     */
    private function executeHandler($handler, Request $request): void
    {
        if (is_array($handler) && count($handler) === 2) {
            // [ControllerClass, 'method']
            [$controllerClass, $method] = $handler;
            $controller = new $controllerClass();
            $controller->$method($request);
        } elseif (is_callable($handler)) {
            $handler($request);
        } else {
            Response::error('Invalid route handler', 500);
        }
    }

    /**
     * Get all registered routes (for debugging/docs)
     */
    public function getRoutes(): array
    {
        return array_map(function ($route) {
            return [
                'method' => $route['method'],
                'path'   => $route['path'],
            ];
        }, $this->routes);
    }
}

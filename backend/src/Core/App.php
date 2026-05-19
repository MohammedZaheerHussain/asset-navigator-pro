<?php

namespace App\Core;

/**
 * Application Bootstrap
 * 
 * Initializes the application, loads routes, applies global middleware,
 * and dispatches the request through the router.
 */
class App
{
    /** @var Router */
    private $router;

    /** @var Request */
    private $request;

    public function __construct()
    {
        $this->router = new Router();
        $this->request = new Request();
    }

    /**
     * Run the application
     */
    public function run(): void
    {
        // Apply global CORS middleware
        $cors = new \App\Middleware\CorsMiddleware();
        $cors->handle($this->request);

        // Load API routes
        $this->loadRoutes();

        // Resolve and dispatch
        $this->router->resolve($this->request);
    }

    /**
     * Load route definitions
     */
    private function loadRoutes(): void
    {
        $router = $this->router;
        require __DIR__ . '/../Routes/api.php';
    }

    /**
     * Get the router instance
     */
    public function getRouter(): Router
    {
        return $this->router;
    }
}

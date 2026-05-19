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

        // Auto-run database migrations (safe: all use IF NOT EXISTS)
        $this->runMigrations();

        // Load API routes
        $this->loadRoutes();

        // Resolve and dispatch
        $this->router->resolve($this->request);
    }

    /**
     * Run all migration SQL files from database/ directory.
     * Each file uses CREATE TABLE IF NOT EXISTS so it's idempotent.
     * Also runs schema.sql first to ensure base tables exist.
     */
    private function runMigrations(): void
    {
        try {
            $db = Database::getInstance()->getConnection();
            $migrationDir = __DIR__ . '/../../database';

            // Run base schema first
            $schemaFile = $migrationDir . '/schema.sql';
            if (file_exists($schemaFile)) {
                $db->exec(file_get_contents($schemaFile));
            }

            // Then run all migration_*.sql files
            $files = glob($migrationDir . '/migration_*.sql');
            if ($files) {
                sort($files);
                foreach ($files as $file) {
                    $db->exec(file_get_contents($file));
                }
            }
        } catch (\Exception $e) {
            // Silently continue — migrations may have already been applied
            // Log for debugging if APP_DEBUG is on
            if (isset($_ENV['APP_DEBUG']) && $_ENV['APP_DEBUG'] === 'true') {
                error_log('Migration notice: ' . $e->getMessage());
            }
        }
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

<?php
/**
 * SNHRC Asset Management System - API Entry Point
 * 
 * All requests are routed through this file.
 * Supports both Apache (mod_rewrite) and PHP built-in server.
 */

// Error reporting based on environment
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Autoload dependencies
require_once __DIR__ . '/vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// Set error reporting based on APP_DEBUG
if (isset($_ENV['APP_DEBUG']) && $_ENV['APP_DEBUG'] === 'true') {
    ini_set('display_errors', 1);
}

// Set timezone
date_default_timezone_set('Asia/Kolkata');

// Bootstrap the application
use App\Core\App;

$app = new App();
$app->run();

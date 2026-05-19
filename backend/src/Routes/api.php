<?php

/**
 * SNHRC Asset Management System - API Routes
 * 
 * All routes are prefixed with /api
 * 
 * @var \App\Core\Router $router
 */

use App\Controllers\AuthController;
use App\Controllers\AssetController;
use App\Controllers\TrackingController;
use App\Controllers\DashboardController;
use App\Controllers\TransferController;
use App\Controllers\BranchController;
use App\Controllers\DepartmentController;
use App\Controllers\CategoryController;
use App\Controllers\UserController;
use App\Controllers\DocumentController;
use App\Controllers\ServiceController;
use App\Middleware\AuthMiddleware;
use App\Middleware\AdminMiddleware;

// ============================================================
// Health Check (No Auth)
// ============================================================
$router->get('/api/health', function ($request) {
    \App\Core\Response::success([
        'status'  => 'running',
        'version' => '1.0.0',
        'time'    => date('Y-m-d H:i:s'),
    ], 'API is healthy');
});

// ============================================================
// Authentication Routes (No Auth Required)
// ============================================================
$router->post('/api/auth/login', [AuthController::class, 'login']);

// ============================================================
// Protected Routes (Auth Required)
// ============================================================
$authMw = [AuthMiddleware::class];
$adminMw = [AuthMiddleware::class, AdminMiddleware::class];

// Auth - Protected
$router->post('/api/auth/register', [AuthController::class, 'register'], $adminMw);
$router->get('/api/auth/profile', [AuthController::class, 'profile'], $authMw);
$router->put('/api/auth/profile', [AuthController::class, 'updateProfile'], $authMw);
$router->post('/api/auth/change-password', [AuthController::class, 'changePassword'], $authMw);

// Material Tracking (CRITICAL)
$router->get('/api/track', [TrackingController::class, 'track'], $authMw);

// ── User Management (Admin Only for mutations) ──
$router->get('/api/users', [UserController::class, 'index'], $adminMw);
$router->post('/api/users', [UserController::class, 'store'], $adminMw);
$router->get('/api/users/{id}', [UserController::class, 'show'], $adminMw);
$router->put('/api/users/{id}', [UserController::class, 'update'], $adminMw);
$router->delete('/api/users/{id}', [UserController::class, 'destroy'], $adminMw);
$router->patch('/api/users/{id}/status', [UserController::class, 'toggleStatus'], $adminMw);

// Assets
$router->get('/api/assets', [AssetController::class, 'index'], $authMw);
$router->post('/api/assets', [AssetController::class, 'store'], $authMw);
$router->get('/api/assets/flagged', [ServiceController::class, 'flaggedAssets'], $authMw);
$router->get('/api/assets/{code}', [AssetController::class, 'show'], $authMw);
$router->put('/api/assets/{code}', [AssetController::class, 'update'], $authMw);
$router->delete('/api/assets/{code}', [AssetController::class, 'destroy'], $adminMw);

// Documents (Invoices & Service Bills)
$router->get('/api/documents', [DocumentController::class, 'index'], $authMw);
$router->get('/api/documents/stats', [DocumentController::class, 'stats'], $authMw);
$router->post('/api/documents', [DocumentController::class, 'store'], $authMw);
$router->get('/api/documents/{id}', [DocumentController::class, 'show'], $authMw);
$router->get('/api/documents/{id}/download', [DocumentController::class, 'download'], $authMw);
$router->delete('/api/documents/{id}', [DocumentController::class, 'destroy'], $adminMw);

// Dashboard
$router->get('/api/dashboard/stats', [DashboardController::class, 'stats'], $authMw);
$router->get('/api/dashboard/assets-by-category', [DashboardController::class, 'assetsByCategory'], $authMw);
$router->get('/api/dashboard/assets-by-branch', [DashboardController::class, 'assetsByBranch'], $authMw);
$router->get('/api/dashboard/recent-activity', [DashboardController::class, 'recentActivity'], $authMw);
$router->get('/api/dashboard/expiring-warranties', [DashboardController::class, 'expiringWarranties'], $authMw);

// Transfers
$router->get('/api/transfers', [TransferController::class, 'index'], $authMw);
$router->post('/api/transfers', [TransferController::class, 'store'], $authMw);
$router->get('/api/transfers/{id}', [TransferController::class, 'show'], $authMw);
$router->put('/api/transfers/{id}/complete', [TransferController::class, 'complete'], $authMw);
$router->put('/api/transfers/{id}/cancel', [TransferController::class, 'cancel'], $authMw);
$router->get('/api/transfers/asset/{code}', [TransferController::class, 'assetHistory'], $authMw);

// Master Data - Branches
$router->get('/api/branches', [BranchController::class, 'index'], $authMw);
$router->post('/api/branches', [BranchController::class, 'store'], $adminMw);
$router->get('/api/branches/{id}', [BranchController::class, 'show'], $authMw);
$router->put('/api/branches/{id}', [BranchController::class, 'update'], $adminMw);

// Master Data - Departments
$router->get('/api/departments', [DepartmentController::class, 'index'], $authMw);
$router->post('/api/departments', [DepartmentController::class, 'store'], $adminMw);
$router->get('/api/departments/{id}', [DepartmentController::class, 'show'], $authMw);
$router->put('/api/departments/{id}', [DepartmentController::class, 'update'], $adminMw);

// Master Data - Categories
$router->get('/api/categories', [CategoryController::class, 'index'], $authMw);
$router->post('/api/categories', [CategoryController::class, 'store'], $adminMw);
$router->put('/api/categories/{id}', [CategoryController::class, 'update'], $adminMw);

// ── Reports (Multi-User Report System) ──
use App\Controllers\ReportController;

$router->get('/api/reports', [ReportController::class, 'index'], $authMw);
$router->post('/api/reports', [ReportController::class, 'store'], $adminMw);
$router->get('/api/reports/{id}/history', [ReportController::class, 'history'], $authMw);
$router->get('/api/reports/{id}', [ReportController::class, 'show'], $authMw);
$router->put('/api/reports/{id}', [ReportController::class, 'update'], $authMw);
$router->delete('/api/reports/{id}', [ReportController::class, 'destroy'], $adminMw);

// ============================================================
// Service & Depreciation Management
// ============================================================

// Service Records
$router->get('/api/services', [ServiceController::class, 'listServices'], $authMw);
$router->get('/api/services/dashboard', [ServiceController::class, 'serviceDashboard'], $authMw);
$router->post('/api/services', [ServiceController::class, 'createService'], $authMw);
$router->get('/api/services/{id}', [ServiceController::class, 'getService'], $authMw);
$router->put('/api/services/{id}', [ServiceController::class, 'updateService'], $authMw);
$router->delete('/api/services/{id}', [ServiceController::class, 'deleteService'], $adminMw);
$router->get('/api/assets/{code}/services', [ServiceController::class, 'getAssetServices'], $authMw);

// Depreciation
$router->get('/api/depreciation/config', [ServiceController::class, 'listDepreciationConfigs'], $authMw);
$router->post('/api/depreciation/config', [ServiceController::class, 'upsertDepreciationConfig'], $adminMw);
$router->get('/api/depreciation/report', [ServiceController::class, 'depreciationReport'], $authMw);
$router->get('/api/assets/{code}/depreciation', [ServiceController::class, 'getAssetDepreciation'], $authMw);
$router->get('/api/assets/{code}/valuation', [ServiceController::class, 'getAssetValuation'], $authMw);

// Evaluation & Flagging (route registered before /api/assets/{code} to avoid conflict)

// Condemnation Workflow
$router->get('/api/condemnation', [ServiceController::class, 'listCondemnations'], $authMw);
$router->post('/api/condemnation', [ServiceController::class, 'createCondemnation'], $authMw);
$router->get('/api/condemnation/{id}', [ServiceController::class, 'getCondemnation'], $authMw);
$router->put('/api/condemnation/{id}/review', [ServiceController::class, 'reviewCondemnation'], $adminMw);

// Disposal
$router->get('/api/disposal', [ServiceController::class, 'listDisposals'], $authMw);
$router->post('/api/disposal', [ServiceController::class, 'createDisposal'], $adminMw);
$router->get('/api/disposal/stats', [ServiceController::class, 'disposalStats'], $authMw);

// ============================================================
// Procurement & Supply Management
// ============================================================
use App\Controllers\ProcurementController;

// Suppliers
$router->get('/api/suppliers/stats', [ProcurementController::class, 'supplierStats'], $authMw);
$router->get('/api/suppliers', [ProcurementController::class, 'listSuppliers'], $authMw);
$router->post('/api/suppliers', [ProcurementController::class, 'createSupplier'], $authMw);
$router->get('/api/suppliers/{id}', [ProcurementController::class, 'getSupplier'], $authMw);
$router->put('/api/suppliers/{id}', [ProcurementController::class, 'updateSupplier'], $authMw);
$router->delete('/api/suppliers/{id}', [ProcurementController::class, 'deleteSupplier'], $adminMw);

// Purchases
$router->get('/api/purchases/stats', [ProcurementController::class, 'purchaseStats'], $authMw);
$router->get('/api/purchases', [ProcurementController::class, 'listPurchases'], $authMw);
$router->post('/api/purchases', [ProcurementController::class, 'createPurchase'], $authMw);
$router->get('/api/purchases/{id}', [ProcurementController::class, 'getPurchase'], $authMw);
$router->put('/api/purchases/{id}', [ProcurementController::class, 'updatePurchase'], $authMw);
$router->post('/api/purchases/{id}/approve', [ProcurementController::class, 'approvePurchase'], $adminMw);
$router->post('/api/purchases/{id}/reject', [ProcurementController::class, 'rejectPurchase'], $adminMw);
$router->post('/api/purchases/{id}/generate-assets', [ProcurementController::class, 'generateAssets'], $adminMw);

// Invoices
$router->get('/api/purchases/{id}/invoices', [ProcurementController::class, 'listInvoicesForPurchase'], $authMw);
$router->post('/api/purchases/{id}/invoices', [ProcurementController::class, 'uploadInvoice'], $authMw);
$router->get('/api/invoices', [ProcurementController::class, 'listAllInvoices'], $authMw);
$router->delete('/api/invoices/{id}', [ProcurementController::class, 'deleteInvoice'], $adminMw);

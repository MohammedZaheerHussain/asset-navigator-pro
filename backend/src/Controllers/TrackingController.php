<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\TrackingService;

/**
 * Tracking Controller (CRITICAL)
 * 
 * Smart tracking: GET /api/track?value=XXX
 * Optional: GET /api/track?type=barcode|serial|assetCode&value=XXX
 * Auto-detects type when not specified.
 */
class TrackingController
{
    private $trackingService;

    public function __construct()
    {
        $this->trackingService = new TrackingService();
    }

    public function track(Request $request): void
    {
        $value = trim($request->query('value', ''));
        $type = $request->query('type', 'auto'); // auto-detect by default

        if (empty($value)) {
            Response::error('Search value is required. Use ?value=YOUR_VALUE', 400);
            return;
        }

        // Input length validation
        if (strlen($value) < 2 || strlen($value) > 100) {
            Response::error('Search value must be between 2 and 100 characters', 400);
            return;
        }

        $result = $this->trackingService->track($type, $value);

        if ($result['success']) {
            Response::success($result['data'], 'Asset found');
        } else {
            Response::notFound($result['message']);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Services\ResponseService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(DashboardService $dashboard): JsonResponse
    {
        return ResponseService::success($dashboard->resumo());
    }
}

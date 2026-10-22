<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVendaRequest;
use App\Http\Resources\VendaResource;
use App\Services\ResponseService;
use App\Services\VendaService;
use Illuminate\Http\JsonResponse;

class VendaController extends Controller
{
    public function __construct(private VendaService $service) {}

    public function index(): JsonResponse
    {
        return ResponseService::success(VendaResource::collection($this->service->listar()));
    }

    public function store(StoreVendaRequest $request): JsonResponse
    {
        $venda = $this->service->criar($request->validated(), (string) $request->user()->id);

        return ResponseService::success(new VendaResource($venda), 'Venda registrada e estoque atualizado.', 201);
    }
}

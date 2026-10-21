<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrcamentoRequest;
use App\Http\Requests\UpdateOrcamentoRequest;
use App\Http\Resources\OrcamentoResource;
use App\Services\OrcamentoService;
use App\Services\ResponseService;
use Illuminate\Http\JsonResponse;

class OrcamentoController extends Controller
{
    public function __construct(private OrcamentoService $service) {}

    public function index(): JsonResponse
    {
        return ResponseService::success(
            OrcamentoResource::collection($this->service->listar())
        );
    }

    public function store(StoreOrcamentoRequest $request): JsonResponse
    {
        $orcamento = $this->service->criar($request->validated());

        return ResponseService::success(
            new OrcamentoResource($orcamento),
            'Orçamento criado com sucesso.',
            201
        );
    }

    public function show(string $id): JsonResponse
    {
        return ResponseService::success(
            new OrcamentoResource($this->service->buscar($id))
        );
    }

    public function update(UpdateOrcamentoRequest $request, string $id): JsonResponse
    {
        $orcamento = $this->service->atualizar($id, $request->validated());

        return ResponseService::success(
            new OrcamentoResource($orcamento),
            'Orçamento atualizado com sucesso.'
        );
    }

    public function destroy(string $id): JsonResponse
    {
        $this->service->deletar($id);

        return ResponseService::success(null, 'Orçamento excluído com sucesso.');
    }
}

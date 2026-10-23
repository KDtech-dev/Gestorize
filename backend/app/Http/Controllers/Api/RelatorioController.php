<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RelatorioService;
use App\Services\ResponseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RelatorioController extends Controller
{
    public function __construct(private RelatorioService $service) {}

    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'periodo' => ['sometimes', 'in:hoje,semana,mes,ano'],
            'tipo' => ['sometimes', 'in:movimentacao,orcamentos,vendas,clientes,produtos'],
        ]);

        $dados = $this->service->gerar(
            $filtros['periodo'] ?? 'hoje',
            $filtros['tipo'] ?? 'movimentacao',
        );

        return ResponseService::success($dados);
    }
}

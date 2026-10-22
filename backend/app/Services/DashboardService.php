<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Orcamento;
use App\Models\Produto;

class DashboardService
{
    /** @return array{clientes:int,orcamentos_aprovados:int,orcamentos_pendentes:int,produtos_em_estoque:int} */
    public function resumo(): array
    {
        return [
            'clientes' => Cliente::query()->count(),
            'orcamentos_aprovados' => Orcamento::query()
                ->where('status', 'aprovado')
                ->count(),
            'orcamentos_pendentes' => Orcamento::query()
                ->where('status', 'pendente')
                ->count(),
            'produtos_em_estoque' => Produto::query()
                ->where('estoque', '>', 0)
                ->count(),
        ];
    }
}

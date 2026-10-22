<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Orcamento;
use App\Models\Produto;
use App\Models\User;

class DashboardService
{
    /** @return array{clientes:?int,orcamentos_aprovados:?int,orcamentos_pendentes:?int,produtos_em_estoque:?int} */
    public function resumo(User $usuario): array
    {
        return [
            'clientes' => $usuario->can('clientes.ver') ? Cliente::query()->count() : null,
            'orcamentos_aprovados' => $usuario->can('orcamentos.ver') ? Orcamento::query()
                ->where('status', 'aprovado')
                ->count() : null,
            'orcamentos_pendentes' => $usuario->can('orcamentos.ver') ? Orcamento::query()
                ->where('status', 'pendente')
                ->count() : null,
            'produtos_em_estoque' => $usuario->can('produtos.ver') ? Produto::query()
                ->where('estoque', '>', 0)
                ->count() : null,
        ];
    }
}

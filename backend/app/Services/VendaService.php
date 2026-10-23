<?php

namespace App\Services;

use App\Models\Produto;
use App\Models\Venda;
use App\Models\Cliente;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VendaService
{
    public function listar()
    {
        return Venda::with(['usuario', 'cliente', 'itens'])->latest('vendido_em')->get();
    }

    public function criar(array $dados, string $usuarioId): Venda
    {
        return DB::transaction(function () use ($dados, $usuarioId) {
            $cliente = !empty($dados['cliente_id'])
                ? Cliente::findOrFail($dados['cliente_id'])
                : null;

            $venda = Venda::create([
                'usuario_id' => $usuarioId,
                'cliente_id' => $cliente?->id,
                'cliente_nome' => $cliente?->nome,
                'forma_pagamento' => $dados['forma_pagamento'] ?? null,
                'valor_total' => 0,
                'vendido_em' => now(),
            ]);
            $total = 0;

            $itensOrdenados = collect($dados['itens'])->sortBy('produto_id');

            foreach ($itensOrdenados as $item) {
                $produto = Produto::query()->lockForUpdate()->findOrFail($item['produto_id']);
                $quantidade = (int) $item['quantidade'];

                if ($produto->estoque < $quantidade) {
                    throw ValidationException::withMessages([
                        'itens' => ["Estoque insuficiente para {$produto->nome}. Disponível: {$produto->estoque}."],
                    ]);
                }

                $preco = (float) $produto->preco_venda;
                $subtotal = round($preco * $quantidade, 2);
                $venda->itens()->create([
                    'produto_id' => $produto->id,
                    'produto_nome' => $produto->nome,
                    'codigo_barras' => $produto->codigo_barras,
                    'quantidade' => $quantidade,
                    'preco_unitario' => $preco,
                    'subtotal' => $subtotal,
                ]);

                $produto->decrement('estoque', $quantidade);
                $total += $subtotal;
            }

            $venda->update(['valor_total' => $total]);

            return $venda->load(['usuario', 'cliente', 'itens']);
        });
    }
}

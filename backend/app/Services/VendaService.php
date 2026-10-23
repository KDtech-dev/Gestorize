<?php

namespace App\Services;

use App\Models\Produto;
use App\Models\Venda;
use App\Models\Cliente;
use App\Models\Orcamento;
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
            $orcamento = null;
            $itensOrcamento = collect();
            if (!empty($dados['orcamento_id'])) {
                $orcamento = Orcamento::query()->with('itens')->lockForUpdate()->findOrFail($dados['orcamento_id']);

                if ($orcamento->status !== 'aprovado') {
                    throw ValidationException::withMessages(['orcamento_id' => ['Somente orçamentos aprovados podem gerar uma venda.']]);
                }
                if (Venda::query()->where('orcamento_id', $orcamento->id)->exists()) {
                    throw ValidationException::withMessages(['orcamento_id' => ['Este orçamento já foi convertido em venda.']]);
                }

                $itensOrcamento = $orcamento->itens
                    ->groupBy('produto_id')
                    ->map(function ($itens) {
                        $quantidade = (int) $itens->sum('quantidade');
                        $subtotal = (float) $itens->sum(fn ($item) => (float) $item->preco_unitario * (int) $item->quantidade);

                        return [
                            'quantidade' => $quantidade,
                            'preco_unitario' => $quantidade > 0 ? round($subtotal / $quantidade, 2) : 0,
                        ];
                    });
                $itensSolicitados = collect($dados['itens'])
                    ->mapWithKeys(fn ($item) => [(string) $item['produto_id'] => (int) $item['quantidade']])
                    ->sortKeys();
                $itensEsperados = $itensOrcamento
                    ->mapWithKeys(fn ($item, $produtoId) => [(string) $produtoId => (int) $item['quantidade']])
                    ->sortKeys();

                if ($itensSolicitados->all() !== $itensEsperados->all()) {
                    throw ValidationException::withMessages(['itens' => ['Os produtos e quantidades devem corresponder ao orçamento selecionado.']]);
                }
                if (!empty($dados['cliente_id']) && $dados['cliente_id'] !== $orcamento->cliente_id) {
                    throw ValidationException::withMessages(['cliente_id' => ['O cliente deve ser o mesmo informado no orçamento.']]);
                }
            }

            $clienteId = $orcamento?->cliente_id ?? ($dados['cliente_id'] ?? null);
            $cliente = $clienteId
                ? Cliente::findOrFail($clienteId)
                : null;

            $venda = Venda::create([
                'usuario_id' => $usuarioId,
                'cliente_id' => $cliente?->id,
                'orcamento_id' => $orcamento?->id,
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

                $preco = $orcamento
                    ? (float) $itensOrcamento->get($produto->id)['preco_unitario']
                    : (float) $produto->preco_venda;
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

            $desconto = round((float) ($dados['desconto'] ?? 0), 2);
            if ($desconto > $total) {
                throw ValidationException::withMessages(['desconto' => ['O desconto não pode ser maior que o subtotal da venda.']]);
            }

            $venda->update([
                'desconto' => $desconto,
                'valor_total' => round($total - $desconto, 2),
            ]);

            if ($orcamento) {
                $orcamento->forceFill(['status' => 'vendido'])->save();
            }

            return $venda->load(['usuario', 'cliente', 'itens']);
        });
    }
}

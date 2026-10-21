<?php

namespace App\Services;

use App\Models\Orcamento;
use App\Models\Produto;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class OrcamentoService
{
    private const RELACOES = [
        'cliente',
        'itens.produto.categoria',
        'itens.produto.fornecedor',
        'itens.produto.unidadeMedida',
        'itens.produto.imagens',
        'itens.produto.imagemPrincipal',
    ];

    public function listar()
    {
        return Orcamento::with(self::RELACOES)
            ->latest('data_orcamento')
            ->latest()
            ->get();
    }

    public function criar(array $dados): Orcamento
    {
        return DB::transaction(function () use ($dados) {
            $itens = $dados['itens'];
            $dadosOrcamento = Arr::only($dados, ['titulo', 'cliente_id']);
            $dadosOrcamento['data_orcamento'] = now()->toDateString();
            $dadosOrcamento['valor_total'] = 0;

            $orcamento = Orcamento::create($dadosOrcamento);
            $this->salvarItens($orcamento, $itens);
            $orcamento->update(['valor_total' => $orcamento->itens()->sum('subtotal')]);

            return $orcamento->load(self::RELACOES);
        });
    }

    public function buscar(string $id): Orcamento
    {
        return Orcamento::with(self::RELACOES)->findOrFail($id);
    }

    public function atualizar(string $id, array $dados): Orcamento
    {
        return DB::transaction(function () use ($id, $dados) {
            $orcamento = Orcamento::findOrFail($id);
            $itens = $dados['itens'] ?? null;

            $orcamento->update(Arr::only($dados, ['titulo', 'cliente_id']));

            if ($itens !== null) {
                $precosExistentes = $orcamento->itens()
                    ->pluck('preco_unitario', 'produto_id')
                    ->all();
                $orcamento->itens()->delete();
                $this->salvarItens($orcamento, $itens, $precosExistentes);
                $orcamento->update(['valor_total' => $orcamento->itens()->sum('subtotal')]);
            } elseif ($orcamento->itens()->exists()) {
                $orcamento->update(['valor_total' => $orcamento->itens()->sum('subtotal')]);
            }

            return $orcamento->fresh(self::RELACOES);
        });
    }

    public function deletar(string $id): array
    {
        DB::transaction(function () use ($id) {
            Orcamento::findOrFail($id)->delete();
        });

        return ['message' => 'Orçamento removido com sucesso.'];
    }

    private function salvarItens(Orcamento $orcamento, array $itens, array $precosExistentes = []): void
    {
        foreach ($itens as $item) {
            $produto = Produto::findOrFail($item['produto_id']);
            $precoUnitario = (float) ($precosExistentes[$produto->id] ?? $produto->preco_venda ?? 0);
            $quantidade = (int) $item['quantidade'];

            $orcamento->itens()->create([
                'produto_id' => $produto->id,
                'quantidade' => $quantidade,
                'preco_unitario' => $precoUnitario,
                'subtotal' => round($quantidade * $precoUnitario, 2),
            ]);
        }
    }

}

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
        'aprovador',
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
            $orcamento = Orcamento::with('itens')->findOrFail($id);
            if ($orcamento->status === 'vendido') {
                abort(422, 'Orçamentos vendidos não podem ser alterados.');
            }
            $campos = Arr::only($dados, ['titulo', 'cliente_id']);
            $camposAlterados = collect($campos)->contains(
                fn ($valor, $campo) => $orcamento->{$campo} !== $valor
            );
            $itensRecebidos = $dados['itens'] ?? null;
            $itensAlterados = false;

            if ($itensRecebidos !== null) {
                $normalizarItens = static function (array $itens): array {
                    $normalizados = collect($itens)
                        ->mapWithKeys(fn ($item) => [
                            (string) $item['produto_id'] => (int) $item['quantidade'],
                        ])
                        ->all();
                    ksort($normalizados);

                    return $normalizados;
                };

                $itensAtuais = $normalizarItens($orcamento->itens
                    ->map(fn ($item) => [
                        'produto_id' => $item->produto_id,
                        'quantidade' => $item->quantidade,
                    ])
                    ->all());
                $itensAlterados = $itensAtuais !== $normalizarItens($itensRecebidos);
            }

            if ($camposAlterados) {
                $orcamento->update($campos);
            }

            if ($itensAlterados) {
                $precosExistentes = $orcamento->itens()
                    ->pluck('preco_unitario', 'produto_id')
                    ->all();
                $orcamento->itens()->delete();
                $this->salvarItens($orcamento, $itensRecebidos, $precosExistentes);
                $orcamento->update(['valor_total' => $orcamento->itens()->sum('subtotal')]);
            }

            $houveAlteracao = $camposAlterados || $itensAlterados;

            if ($houveAlteracao && $orcamento->status === 'aprovado') {
                $orcamento->status = 'pendente';
                $orcamento->aprovado_por = null;
                $orcamento->aprovado_em = null;
            }

            if ($houveAlteracao) {
                $orcamento->touch();
            }

            return $orcamento->fresh(self::RELACOES);
        });
    }

    public function aprovar(string $id, string $usuarioId): Orcamento
    {
        $orcamento = Orcamento::findOrFail($id);

        if ($orcamento->status === 'vendido') {
            abort(422, 'Orçamentos vendidos não podem ser aprovados novamente.');
        }

        if ($orcamento->status !== 'aprovado') {
            $orcamento->status = 'aprovado';
            $orcamento->aprovado_por = $usuarioId;
            $orcamento->aprovado_em = now();
            $orcamento->save();
        }

        return $orcamento->fresh(self::RELACOES);
    }

    public function deletar(string $id): array
    {
        DB::transaction(function () use ($id) {
            $orcamento = Orcamento::findOrFail($id);
            if ($orcamento->status === 'vendido') {
                abort(422, 'Orçamentos vendidos não podem ser excluídos.');
            }
            $orcamento->delete();
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

<?php

namespace App\Services;

use App\Models\Produto;
use App\Models\ProdutoImagem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProdutoService
{
    public function listar(): Collection
    {
        return Produto::with([
            'categoria',
            'fornecedor',
            'unidadeMedida',
            'imagens',
            'codigosBarras',
        ])
            ->latest()
            ->get();
    }

    public function buscar(string $id): Produto
    {
        return Produto::with([
            'categoria',
            'fornecedor',
            'unidadeMedida',
            'imagens',
            'codigosBarras',
        ])->findOrFail($id);
    }

    public function criar(array $dados): Produto
    {
        return DB::transaction(function () use ($dados) {
            $codigosBarras = $dados['codigos_barras'] ?? null;
            unset($dados['codigos_barras']);
            $produto = Produto::create($dados);
            if ($codigosBarras !== null) $this->sincronizarCodigosBarras($produto, $codigosBarras);

            return $produto->load([
                'categoria',
                'fornecedor',
                'unidadeMedida',
                'imagens',
                'codigosBarras',
            ]);
        });
    }

    public function atualizar(
        Produto $produto,
        array $dados
    ): Produto {
        return DB::transaction(function () use ($produto, $dados) {
            $codigosBarras = $dados['codigos_barras'] ?? null;
            unset($dados['codigos_barras']);
            $produto->update($dados);
            if ($codigosBarras !== null) $this->sincronizarCodigosBarras($produto, $codigosBarras);

            return $produto->fresh([
                'categoria',
                'fornecedor',
                'unidadeMedida',
                'imagens',
                'codigosBarras',
            ]);
        });
    }

    private function sincronizarCodigosBarras(Produto $produto, array $codigos): void
    {
        $codigos = collect($codigos)
            ->map(fn ($codigo) => trim((string) $codigo))
            ->filter(fn ($codigo) => $codigo !== '' && $codigo !== $produto->codigo_barras)
            ->unique()
            ->values();

        $produto->codigosBarras()->whereNotIn('codigo', $codigos->all())->delete();
        foreach ($codigos as $codigo) {
            $produto->codigosBarras()->firstOrCreate(
                ['codigo' => $codigo],
                ['tipo' => 'fabricante']
            );
        }
    }

    public function excluir(Produto $produto): void
    {
        DB::transaction(function () use ($produto) {
            $produto->imagens->each(function (ProdutoImagem $imagem) {
                Storage::disk('public')->delete($imagem->caminho);
            });

            $produto->delete();
        });
    }
}

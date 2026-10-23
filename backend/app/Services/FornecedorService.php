<?php

namespace App\Services;

use App\Models\Endereco;
use App\Models\Fornecedor;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class FornecedorService
{
    public function __construct(
        private FornecedorImagemService $fornecedorImagemService
    ) {}

    public function listar()
    {
        return Fornecedor::with(['endereco', 'categorias'])
            ->orderBy('nome')
            ->get();
    }

    public function criar(array $dados): Fornecedor
    {
        return DB::transaction(function () use ($dados) {
            /** @var UploadedFile|null $avatar */
            $avatar = $dados['avatar'] ?? null;

            unset($dados['avatar']);

            $endereco = isset($dados['endereco'])
                ? Endereco::create($dados['endereco'])
                : null;

            unset($dados['endereco']);

            $categoriaIds = $dados['categoria_ids'] ?? [];
            unset($dados['categoria_ids'], $dados['ramo_atividade']);

            $fornecedor = Fornecedor::create([
                'nome' => $dados['nome'],
                'cnpj' => $dados['cnpj'],
                'email' => $dados['email'] ?? null,
                'telefone' => $dados['telefone'],
                'nome_responsavel' => $dados['nome_responsavel'] ?? null,
                'chave_pix' => $dados['chave_pix'] ?? null,
                'endereco_id' => $endereco?->id,
            ]);

            $fornecedor->categorias()->sync($categoriaIds);

            if ($avatar instanceof UploadedFile) {
                $this->fornecedorImagemService->salvar(
                    $fornecedor->id,
                    $avatar
                );
            }

            return $fornecedor->load(['endereco', 'categorias']);
        });
    }

    public function buscar(string $id): Fornecedor
    {
        return Fornecedor::with(['endereco', 'categorias'])
            ->findOrFail($id);
    }

    public function atualizar(
        string $id,
        array $dados
    ): Fornecedor {
        return DB::transaction(function () use ($id, $dados) {
            $fornecedor = Fornecedor::findOrFail($id);

            $campos = [
                'nome',
                'cnpj',
                'email',
                'telefone',
                'nome_responsavel',
                'chave_pix',
            ];

            $fornecedor->update(
                collect($dados)
                    ->only($campos)
                    ->all()
            );

            if (array_key_exists('categoria_ids', $dados)) {
                $fornecedor->categorias()->sync($dados['categoria_ids'] ?? []);
            }

            if (is_array($dados['endereco'] ?? null)) {
                if ($fornecedor->endereco_id) {
                    Endereco::findOrFail(
                        $fornecedor->endereco_id
                    )->update($dados['endereco']);
                } else {
                    $endereco = Endereco::create(
                        $dados['endereco']
                    );

                    $fornecedor->update([
                        'endereco_id' => $endereco->id,
                    ]);
                }
            }

            return $fornecedor->fresh(['endereco', 'categorias']);
        });
    }

  
    public function deletar(string $id): array
    {
        $fornecedor = Fornecedor::findOrFail($id);

        $fornecedor->delete();

        return [
            'message' => 'Fornecedor removido com sucesso.',
        ];
    }
}

<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Endereco;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class ClienteService
{
    public function __construct(
        private ClienteImagemService $clienteImagemService
    ) {}

    public function listar()
    {
        return Cliente::with([
            'endereco',
            'dadosPf',
            'dadosPj',
        ])->get();
    }

    public function criar(array $dados): Cliente
    {
        return DB::transaction(function () use ($dados) {

            /** @var UploadedFile|null $avatar */
            $avatar = $dados['avatar'] ?? null;

            unset($dados['avatar']);

            $endereco = isset($dados['endereco'])
                ? Endereco::create($dados['endereco'])
                : null;

            $cliente = Cliente::create([
                'nome'        => $dados['nome'],
                'tipo'        => $dados['tipo'],
                'email'       => $dados['email'] ?? null,
                'telefone'    => $dados['telefone'] ?? null,
                'endereco_id' => $endereco?->id,
            ]);

            $dados['tipo'] === 'pf'
                ? $cliente->dadosPf()->create($dados['pf'])
                : $cliente->dadosPj()->create($dados['pj']);

            if ($avatar instanceof UploadedFile) {
                $this->clienteImagemService->salvar(
                    $cliente->id,
                    $avatar
                );
            }

            return $cliente->load([
                'endereco',
                'dadosPf',
                'dadosPj',
            ]);
        });
    }

    public function buscar(string $id): Cliente
    {
        return Cliente::with([
            'endereco',
            'dadosPf',
            'dadosPj',
            'orcamentos' => fn ($query) => $query->latest('data_orcamento')->latest(),
        ])->findOrFail($id);
    }

    public function atualizar(string $id, array $dados): Cliente
    {
        return DB::transaction(function () use ($id, $dados) {
            $cliente = Cliente::findOrFail($id);

            $cliente->update(
                collect($dados)
                    ->only(['nome', 'email', 'telefone'])
                    ->all()
            );

            if (is_array($dados['endereco'] ?? null)) {
                $cliente->endereco_id
                    ? Endereco::findOrFail(
                        $cliente->endereco_id
                    )->update($dados['endereco'])
                    : $cliente->update([
                        'endereco_id' => Endereco::create(
                            $dados['endereco']
                        )->id,
                    ]);
            }

            if ($cliente->tipo === 'pf' && isset($dados['pf'])) {
                $cliente->dadosPf()->updateOrCreate(
                    ['cliente_id' => $cliente->id],
                    $dados['pf']
                );
            }

            if ($cliente->tipo === 'pj' && isset($dados['pj'])) {
                $cliente->dadosPj()->updateOrCreate(
                    ['cliente_id' => $cliente->id],
                    $dados['pj']
                );
            }

            return $cliente->fresh([
                'endereco',
                'dadosPf',
                'dadosPj',
            ]);
        });
    }

    public function deletar(string $id): array
    {
        DB::transaction(function () use ($id) {
            $cliente = Cliente::findOrFail($id);
            $cliente->orcamentos()->delete();
            $cliente->delete();
        });

        return [
            'message' => 'Cliente removido',
        ];
    }
}

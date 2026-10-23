<?php

namespace App\Services;

use App\Models\User;
use App\Models\Funcionario;
use App\Models\Endereco;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function atualizarMeuPerfil(User $user, array $dados): User
    {
        return DB::transaction(function () use ($user, $dados) {
            $user->update([
                'name' => $dados['name'],
                'email' => $dados['email'],
                ...(!empty($dados['password']) ? ['password' => Hash::make($dados['password'])] : []),
            ]);

            $funcionario = $user->funcionario;
            if ($funcionario && isset($dados['funcionario'])) {
                $funcionario->update($dados['funcionario']);
            }

            if ($funcionario && isset($dados['endereco'])) {
                $endereco = $funcionario->endereco;
                $camposEndereco = $dados['endereco'];
                if (!$endereco && collect($camposEndereco)->contains(fn ($valor) => $valor !== null && $valor !== '')) {
                    $endereco = Endereco::create(array_merge([
                        'cep' => '', 'logradouro' => '', 'numero' => '', 'complemento' => null,
                        'bairro' => '', 'cidade' => '', 'estado' => '',
                    ], $camposEndereco));
                    $funcionario->update(['endereco_id' => $endereco->id]);
                } elseif ($endereco) {
                    $endereco->update($camposEndereco);
                }
            }

            return $user->fresh()->load(['roles.permissions', 'permissions', 'funcionario.endereco']);
        });
    }

    public function criar(array $dados): User
    {
        return DB::transaction(function () use ($dados) {
            $endereco = Endereco::create($dados['endereco']);

            $user = User::create([
                'name'     => $dados['name'],
                'email'    => $dados['email'],
                'password' => Hash::make($dados['password']),
                'must_change_password' => ($dados['role'] ?? null) === 'gestor',
            ]);


            if (isset($dados['role'])) {
                $user->syncRoles([$dados['role']]);
            }
            if (isset($dados['permissions'])) {
                $user->syncPermissions($dados['permissions']);
            }

            Funcionario::create([
                'user_id'          => $user->id,
                'telefone'         => $dados['funcionario']['telefone'] ?? null,
                'data_nascimento'  => $dados['funcionario']['data_nascimento'] ?? null,
                'cpf'              => $dados['funcionario']['cpf'] ?? null,
                'endereco_id'      => $endereco->id,
            ]);

            $user->assignRole($dados['role']);

            return $user->load('funcionario.endereco');
        });
    }

    public function listar()
    {
        return User::with('funcionario.endereco')->paginate(15);
    }

    public function buscar(string $id): User
    {
        return User::with('funcionario.endereco')->findOrFail($id);
    }

    public function atualizar(string $id, array $dados): User
    {
        return DB::transaction(function () use ($id, $dados) {
            $user = User::findOrFail($id);

            $user->update([
                'name'  => $dados['name']  ?? $user->name,
                'email' => $dados['email'] ?? $user->email,
            ]);

            if (isset($dados['role'])) {
                $user->syncRoles([$dados['role']]);
            }
            if (isset($dados['permissions'])) {          
                $user->syncPermissions($dados['permissions']);
            }

            if (isset($dados['password'])) {
                $user->update(['password' => Hash::make($dados['password'])]);
            }

            if (isset($dados['role'])) {
                $user->syncRoles([$dados['role']]);
            }

            if (isset($dados['funcionario'])) {
                $user->funcionario?->update($dados['funcionario']);
            }

            if (isset($dados['endereco'])) {
                $user->funcionario?->endereco?->update($dados['endereco']);
            }

            return $user->load('funcionario.endereco');
        });
    }

    public function deletar(string $id): void
    {
        DB::transaction(function () use ($id) {
            $user = User::with('funcionario.endereco')->findOrFail($id);

            $user->funcionario?->endereco?->delete();
            $user->funcionario?->delete();
            $user->delete();
        });
    }
}

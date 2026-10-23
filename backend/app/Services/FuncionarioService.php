<?php

namespace App\Services;

use App\Models\Endereco;
use App\Models\Funcionario;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;


class FuncionarioService
{


    private const CAMPOS_USER = ['name', 'email'];
    private const CAMPOS_PERFIL = ['telefone', 'data_nascimento', 'cpf'];

    public function criar(array $dados): Funcionario
    {
        return DB::transaction(function () use ($dados) {
            $endereco = isset($dados['endereco'])
                ? Endereco::create($dados['endereco'])
                : null;

            $user = User::create([
                'name'     => $dados['name'],
                'email'    => $dados['email'],
                'password' => $dados['password'],
                'must_change_password' => ($dados['role'] ?? null) === 'gestor',
            ]);

            $this->definirAcesso($user, $dados);

            $funcionario = $user->funcionario()->create([
                ...Arr::only($dados, self::CAMPOS_PERFIL),
                'endereco_id' => $endereco?->id ?? ($dados['endereco_id'] ?? null),
            ]);

            return $this->carregar($funcionario);
        });
    }

    public function listar(): LengthAwarePaginator
    {
        return Funcionario::query()
            ->whereHas('user', fn ($query) => $query->whereDoesntHave(
                'roles',
                fn ($roles) => $roles->where('name', 'admin'),
            ))
            ->with(['user.roles', 'user.permissions', 'endereco'])
            ->latest()
            ->paginate(15);
    }

    public function buscar(string $id): Funcionario
    {
        return Funcionario::with(['user.roles', 'user.permissions', 'endereco'])->findOrFail($id);
    }

    public function atualizar(string $id, array $dados): Funcionario
    {
        return DB::transaction(function () use ($id, $dados) {
            $funcionario = Funcionario::with(['user', 'endereco'])->findOrFail($id);
            $user = $funcionario->user;

            $user->fill(Arr::only($dados, self::CAMPOS_USER));
            if (filled($dados['password'] ?? null)) {
                $user->password = $dados['password'];
            }
            $user->save();

            $funcionario->fill(Arr::only($dados, [...self::CAMPOS_PERFIL, 'endereco_id']))->save();

            if (isset($dados['endereco'])) {
                $funcionario->endereco
                    ? $funcionario->endereco->update($dados['endereco'])
                    : $funcionario->update([
                        'endereco_id' => Endereco::create($dados['endereco'])->id,
                    ]);
            }

            $this->definirAcesso($user, $dados);

            return $this->carregar($funcionario);
        });
    }


    public function deletar(string $id): void
    {
        $funcionario = Funcionario::with(['user', 'endereco'])->findOrFail($id);
        $avatar = $funcionario->user->avatar;

        DB::transaction(function () use ($funcionario) {
            $funcionario->user->tokens()->delete();
            $funcionario->user->delete();
            $funcionario->endereco?->delete();
        });

        if ($avatar) {
            Storage::disk('public')->delete($avatar);
        }
    }

    private function definirAcesso(User $user, array $dados): void
    {
        if (array_key_exists('role', $dados)) {
            $user->syncRoles([$dados['role']]);
        }

        if (array_key_exists('permissions', $dados)) {
            $doPapel = $user->getPermissionsViaRoles()->pluck('name')->all();
            $extras  = array_values(array_diff($dados['permissions'] ?? [], $doPapel));
            $user->syncPermissions($extras);
        }
    }

    private function carregar(Funcionario $f): Funcionario
    {
        return $f->fresh(['user.roles', 'user.permissions', 'endereco']);
    }
}

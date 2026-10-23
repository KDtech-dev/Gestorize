<?php

namespace Database\Seeders;

use App\Enums\PermissionEnum as P;
use App\Enums\RoleEnum;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        foreach (P::values() as $name) {
            Permission::firstOrCreate([
                'name' => $name,
                'guard_name' => 'api',
            ]);
        }

        $padroes = [
            RoleEnum::ADMIN->value => [],

            RoleEnum::GESTOR->value => [
                P::CLIENTES_VER,
                P::CLIENTES_CRIAR,
                P::CLIENTES_EDITAR,
                P::PRODUTOS_VER,
                P::PRODUTOS_CRIAR,
                P::PRODUTOS_EDITAR,
                P::FORNECEDORES_VER,
                P::FORNECEDORES_CRIAR,
                P::FORNECEDORES_EDITAR,
                P::ORCAMENTOS_VER,
                P::ORCAMENTOS_CRIAR,
                P::ORCAMENTOS_EDITAR,
                P::VENDAS_VER,
                P::VENDAS_CRIAR,
                P::USERS_VER,
                P::USERS_CRIAR,
                P::USERS_EDITAR,
                P::USERS_EXCLUIR,
                P::ACESSOS_GERENCIAR,
                P::RELATORIOS_VER,
            ],

            RoleEnum::FUNCIONARIO->value => [
                P::CLIENTES_VER,
                P::CLIENTES_CRIAR,
                P::ORCAMENTOS_VER,
                P::ORCAMENTOS_CRIAR,
                P::PRODUTOS_VER,
                P::VENDAS_CRIAR,
            ],

            RoleEnum::CLIENTE->value => [
                P::ORCAMENTOS_VER,
            ],
        ];

        foreach ($padroes as $role => $permissoes) {
            $r = Role::firstOrCreate([
                'name' => $role,
                'guard_name' => 'api',
            ]);

            $r->syncPermissions(
                array_map(
                    fn(P $permission) => $permission->value,
                    $permissoes
                )
            );
        }
    }
}

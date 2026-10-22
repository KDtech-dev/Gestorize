<?php

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        foreach ([PermissionEnum::VENDAS_VER, PermissionEnum::VENDAS_CRIAR] as $permissaoEnum) {
            $permissao = Permission::firstOrCreate([
                'name' => $permissaoEnum->value,
                'guard_name' => 'api',
            ]);

            foreach ([RoleEnum::GESTOR, RoleEnum::FUNCIONARIO] as $papelEnum) {
                $papel = Role::query()
                    ->where('name', $papelEnum->value)
                    ->where('guard_name', 'api')
                    ->first();

                if ($papel && !$papel->hasPermissionTo($permissao)) {
                    $papel->givePermissionTo($permissao);
                }
            }
        }
    }

    public function down(): void
    {
        foreach ([PermissionEnum::VENDAS_VER, PermissionEnum::VENDAS_CRIAR] as $permissaoEnum) {
            $permissao = Permission::query()
                ->where('name', $permissaoEnum->value)
                ->where('guard_name', 'api')
                ->first();

            if (!$permissao) {
                continue;
            }

            foreach ([RoleEnum::GESTOR, RoleEnum::FUNCIONARIO] as $papelEnum) {
                $papel = Role::query()
                    ->where('name', $papelEnum->value)
                    ->where('guard_name', 'api')
                    ->first();
                $papel?->revokePermissionTo($permissao);
            }

            $permissao->delete();
        }
    }
};

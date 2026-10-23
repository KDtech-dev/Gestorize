<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $role = DB::table('roles')->where('name', 'gestor')->where('guard_name', 'api')->first();
        if (! $role) return;

        foreach (['users.criar', 'users.editar', 'users.excluir'] as $name) {
            $permission = DB::table('permissions')->where('name', $name)->where('guard_name', 'api')->first();
            if ($permission && ! DB::table('role_has_permissions')->where('role_id', $role->id)->where('permission_id', $permission->id)->exists()) {
                DB::table('role_has_permissions')->insert(['role_id' => $role->id, 'permission_id' => $permission->id]);
            }
        }
    }

    public function down(): void
    {
        DB::table('role_has_permissions')
            ->whereIn('permission_id', DB::table('permissions')->select('id')->whereIn('name', ['users.criar', 'users.editar', 'users.excluir']))
            ->whereIn('role_id', DB::table('roles')->select('id')->where('name', 'gestor')->where('guard_name', 'api'))
            ->delete();
    }
};

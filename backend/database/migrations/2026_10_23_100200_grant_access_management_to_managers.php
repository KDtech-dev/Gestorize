<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $role = DB::table('roles')->where('name', 'gestor')->where('guard_name', 'api')->first();
        $permission = DB::table('permissions')->where('name', 'acessos.gerenciar')->where('guard_name', 'api')->first();

        if ($role && $permission) {
            DB::table('role_has_permissions')->insertOrIgnore([
                'role_id' => $role->id,
                'permission_id' => $permission->id,
            ]);
        }
    }

    public function down(): void
    {
        $roleId = DB::table('roles')->where('name', 'gestor')->where('guard_name', 'api')->value('id');
        $permissionId = DB::table('permissions')->where('name', 'acessos.gerenciar')->where('guard_name', 'api')->value('id');

        if ($roleId && $permissionId) {
            DB::table('role_has_permissions')->where('role_id', $roleId)->where('permission_id', $permissionId)->delete();
        }
    }
};

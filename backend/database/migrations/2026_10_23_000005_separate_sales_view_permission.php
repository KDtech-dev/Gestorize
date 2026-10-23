<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $roleId = DB::table('roles')->where('name', 'funcionario')->where('guard_name', 'api')->value('id');
        $permissionId = DB::table('permissions')->where('name', 'vendas.ver')->where('guard_name', 'api')->value('id');

        if ($roleId && $permissionId) {
            DB::table('role_has_permissions')
                ->where('role_id', $roleId)
                ->where('permission_id', $permissionId)
                ->delete();
        }
    }

    public function down(): void
    {
        $roleId = DB::table('roles')->where('name', 'funcionario')->where('guard_name', 'api')->value('id');
        $permissionId = DB::table('permissions')->where('name', 'vendas.ver')->where('guard_name', 'api')->value('id');

        if ($roleId && $permissionId) {
            DB::table('role_has_permissions')->insertOrIgnore([
                'role_id' => $roleId,
                'permission_id' => $permissionId,
            ]);
        }
    }
};

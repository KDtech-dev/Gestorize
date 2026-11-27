<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Permission;
use App\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendas', function (Blueprint $table) {
            $table->foreignUuid('estornada_autorizada_por')->nullable()->after('estornada_por')
                ->constrained('users')->nullOnDelete();
            $table->string('estornada_autorizada_nome')->nullable()->after('estornada_autorizada_por');
        });

        $permission = Permission::firstOrCreate([
            'name' => 'vendas.estornar',
            'guard_name' => 'api',
        ]);

        Role::query()
            ->where('name', 'gestor')
            ->where('guard_name', 'api')
            ->first()
            ?->givePermissionTo($permission);
    }

    public function down(): void
    {
        $permission = Permission::query()
            ->where('name', 'vendas.estornar')
            ->where('guard_name', 'api')
            ->first();

        if ($permission) {
            Role::query()->where('guard_name', 'api')->get()->each(
                fn (Role $role) => $role->revokePermissionTo($permission)
            );
            $permission->delete();
        }

        Schema::table('vendas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('estornada_autorizada_por');
            $table->dropColumn('estornada_autorizada_nome');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    private array $tables = ['users', 'enderecos', 'categorias', 'fornecedores', 'unidades_medida', 'clientes', 'clientes_pf', 'clientes_pj', 'funcionarios', 'produtos', 'orcamentos', 'vendas'];

    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('document', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            $table->json('settings')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        $organizationId = (string) Str::uuid();
        DB::table('organizations')->insert([
            'id' => $organizationId,
            'name' => 'Organização padrão',
            'settings' => json_encode(new stdClass()),
            'active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($this->tables as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->uuid('organization_id')->nullable()->index();
                $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            });
        }

        DB::table('users')->whereNotIn('id', function ($query) {
            $query->select('model_id')->from('model_has_roles')->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('roles.name', 'admin')->where('model_has_roles.model_type', 'App\\Models\\User');
        })->update(['organization_id' => $organizationId]);

        foreach (array_diff($this->tables, ['users']) as $name) {
            DB::table($name)->whereNull('organization_id')->update(['organization_id' => $organizationId]);
        }

        Schema::table('fornecedores', function (Blueprint $table) {
            $table->dropUnique('fornecedores_cnpj_unique');
            $table->unique(['organization_id', 'cnpj'], 'fornecedores_org_cnpj_unique');
        });
        Schema::table('produtos', function (Blueprint $table) {
            $table->dropUnique('produtos_codigo_barras_unique');
            $table->unique(['organization_id', 'codigo_barras'], 'produtos_org_codigo_barras_unique');
        });
        Schema::table('clientes_pf', function (Blueprint $table) {
            $table->dropUnique('clientes_pf_cpf_unique');
            $table->unique(['organization_id', 'cpf'], 'clientes_pf_org_cpf_unique');
        });
        Schema::table('clientes_pj', function (Blueprint $table) {
            $table->unique(['organization_id', 'cnpj'], 'clientes_pj_org_cnpj_unique');
        });
        Schema::table('funcionarios', function (Blueprint $table) {
            $table->dropUnique('funcionarios_cpf_unique');
            $table->unique(['organization_id', 'cpf'], 'funcionarios_org_cpf_unique');
        });
    }

    public function down(): void
    {
        Schema::table('funcionarios', function (Blueprint $table) {
            $table->dropUnique('funcionarios_org_cpf_unique');
        });
        Schema::table('clientes_pf', function (Blueprint $table) {
            $table->dropUnique('clientes_pf_org_cpf_unique');
        });
        Schema::table('clientes_pj', function (Blueprint $table) {
            $table->dropUnique('clientes_pj_org_cnpj_unique');
        });
        Schema::table('produtos', function (Blueprint $table) {
            $table->dropUnique('produtos_org_codigo_barras_unique');
        });
        Schema::table('fornecedores', function (Blueprint $table) {
            $table->dropUnique('fornecedores_org_cnpj_unique');
        });
        foreach (array_reverse($this->tables) as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->dropForeign(['organization_id']);
                $table->dropIndex(['organization_id']);
                $table->dropColumn('organization_id');
            });
        }
        Schema::table('funcionarios', fn (Blueprint $table) => $table->unique('cpf'));
        Schema::table('clientes_pf', fn (Blueprint $table) => $table->unique('cpf'));
        Schema::table('produtos', fn (Blueprint $table) => $table->unique('codigo_barras'));
        Schema::table('fornecedores', fn (Blueprint $table) => $table->unique('cnpj'));
        Schema::dropIfExists('organizations');
    }
};

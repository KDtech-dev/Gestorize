<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('funcionarios', function (Blueprint $table) {
            $table->string('codigo_cracha', 12)->nullable()->after('organization_id');
        });

        DB::table('funcionarios')->select(['id', 'organization_id'])->orderBy('id')->get()->each(
            function ($funcionario): void {
                do {
                    $codigo = Str::upper(Str::random(12));
                    $existe = DB::table('funcionarios')
                        ->where('organization_id', $funcionario->organization_id)
                        ->where('codigo_cracha', $codigo)
                        ->exists();
                } while ($existe);

                DB::table('funcionarios')->where('id', $funcionario->id)->update(['codigo_cracha' => $codigo]);
            }
        );

        Schema::table('funcionarios', function (Blueprint $table) {
            $table->unique(['organization_id', 'codigo_cracha'], 'funcionarios_org_codigo_cracha_unique');
        });
    }

    public function down(): void
    {
        Schema::table('funcionarios', function (Blueprint $table) {
            $table->dropUnique('funcionarios_org_codigo_cracha_unique');
            $table->dropColumn('codigo_cracha');
        });
    }
};

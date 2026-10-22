<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('produtos', function (Blueprint $table) {
            $table->string('codigo_barras', 32)->nullable();
        });

        DB::table('produtos')->whereNull('codigo_barras')->orderBy('id')->select('id')->each(function ($produto) {
            do {
                $codigo = 'PRD' . strtoupper(Str::random(9));
            } while (DB::table('produtos')->where('codigo_barras', $codigo)->exists());

            DB::table('produtos')->where('id', $produto->id)->update(['codigo_barras' => $codigo]);
        });

        Schema::table('produtos', function (Blueprint $table) {
            $table->unique('codigo_barras');
        });
    }

    public function down(): void
    {
        Schema::table('produtos', function (Blueprint $table) {
            $table->dropUnique(['codigo_barras']);
            $table->dropColumn('codigo_barras');
        });
    }
};

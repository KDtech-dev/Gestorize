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
        Schema::create('categoria_fornecedor', function (Blueprint $table) {
            $table->uuid('fornecedor_id');
            $table->uuid('categoria_id');
            $table->timestamps();
            $table->primary(['fornecedor_id', 'categoria_id']);
            $table->foreign('fornecedor_id')->references('id')->on('fornecedores')->cascadeOnDelete();
            $table->foreign('categoria_id')->references('id')->on('categorias')->cascadeOnDelete();
        });

        foreach (DB::table('fornecedores')->whereNotNull('ramo_atividade')->where('ramo_atividade', '!=', '')->get(['id', 'ramo_atividade']) as $fornecedor) {
            $nome = trim($fornecedor->ramo_atividade);
            $categoria = DB::table('categorias')->where('nome', $nome)->first(['id']);
            $categoriaId = $categoria?->id ?? (function () use ($nome) {
                $id = (string) Str::uuid();
                DB::table('categorias')->insert(['id' => $id, 'nome' => $nome, 'created_at' => now(), 'updated_at' => now()]);
                return $id;
            })();
            DB::table('categoria_fornecedor')->insertOrIgnore([
                'fornecedor_id' => $fornecedor->id,
                'categoria_id' => $categoriaId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('categoria_fornecedor');
    }
};

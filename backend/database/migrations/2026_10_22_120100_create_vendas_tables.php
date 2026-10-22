<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('valor_total', 12, 2)->default(0);
            $table->timestamp('vendido_em')->useCurrent();
            $table->timestamps();
        });

        Schema::create('venda_itens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('venda_id')->constrained('vendas')->cascadeOnDelete();
            $table->foreignUuid('produto_id')->nullable()->constrained('produtos')->nullOnDelete();
            $table->string('produto_nome');
            $table->string('codigo_barras', 32)->nullable();
            $table->unsignedInteger('quantidade');
            $table->decimal('preco_unitario', 10, 2);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venda_itens');
        Schema::dropIfExists('vendas');
    }
};

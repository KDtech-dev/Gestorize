<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('produtos', function (Blueprint $table) {
            $table->string('etiqueta_assinatura_impressa', 64)->nullable();
            $table->timestamp('etiqueta_impressa_em')->nullable();
        });

        Schema::create('etiqueta_operacoes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('tipo', 30);
            $table->string('status', 30)->default('aguardando_confirmacao')->index();
            $table->string('idempotency_key', 64);
            $table->unsignedInteger('total_produtos');
            $table->unsignedInteger('total_etiquetas');
            $table->text('erro')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'idempotency_key'], 'etiqueta_op_org_key_unique');
        });

        Schema::create('etiqueta_operacao_itens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('operacao_id')->constrained('etiqueta_operacoes')->cascadeOnDelete();
            $table->foreignUuid('produto_id')->nullable()->constrained('produtos')->nullOnDelete();
            $table->string('produto_nome');
            $table->string('codigo_barras', 100)->nullable();
            $table->string('categoria_nome')->nullable();
            $table->string('fornecedor_nome')->nullable();
            $table->string('unidade_sigla', 30)->nullable();
            $table->decimal('preco_venda', 12, 2)->nullable();
            $table->string('assinatura', 64);
            $table->unsignedInteger('quantidade');
            $table->timestamps();
            $table->index(['organization_id', 'produto_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('etiqueta_operacao_itens');
        Schema::dropIfExists('etiqueta_operacoes');
        Schema::table('produtos', function (Blueprint $table) {
            $table->dropColumn(['etiqueta_assinatura_impressa', 'etiqueta_impressa_em']);
        });
    }
};

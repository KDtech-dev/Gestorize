<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produto_codigos_barras', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('produto_id')->constrained('produtos')->cascadeOnDelete();
            $table->string('codigo', 64);
            $table->string('tipo', 30)->default('fabricante');
            $table->timestamps();
            $table->unique(['organization_id', 'codigo'], 'produto_codigos_barras_org_codigo_unique');
            $table->index(['organization_id', 'produto_id'], 'produto_codigos_barras_org_produto_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produto_codigos_barras');
    }
};

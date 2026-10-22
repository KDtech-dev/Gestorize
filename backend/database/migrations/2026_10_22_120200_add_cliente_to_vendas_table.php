<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendas', function (Blueprint $table) {
            $table->foreignUuid('cliente_id')->nullable()->after('usuario_id')
                ->constrained('clientes')->nullOnDelete();
            $table->string('cliente_nome')->nullable()->after('cliente_id');
        });
    }

    public function down(): void
    {
        Schema::table('vendas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cliente_id');
            $table->dropColumn('cliente_nome');
        });
    }
};

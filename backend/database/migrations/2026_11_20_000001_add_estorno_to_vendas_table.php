<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendas', function (Blueprint $table) {
            $table->string('status', 20)->default('concluida')->after('valor_total');
            $table->timestamp('estornada_em')->nullable()->after('status');
            $table->foreignUuid('estornada_por')->nullable()->after('estornada_em')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('vendas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('estornada_por');
            $table->dropColumn(['estornada_em', 'status']);
        });
    }
};

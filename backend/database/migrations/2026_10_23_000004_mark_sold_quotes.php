<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('vendas', 'orcamento_id')) {
            return;
        }

        DB::table('orcamentos')
            ->whereIn('id', DB::table('vendas')->select('orcamento_id')->whereNotNull('orcamento_id'))
            ->update(['status' => 'vendido', 'updated_at' => now()]);
    }

    public function down(): void
    {
        if (!Schema::hasColumn('vendas', 'orcamento_id')) {
            return;
        }

        DB::table('orcamentos')
            ->where('status', 'vendido')
            ->whereIn('id', DB::table('vendas')->select('orcamento_id')->whereNotNull('orcamento_id'))
            ->update(['status' => 'aprovado', 'updated_at' => now()]);
    }
};

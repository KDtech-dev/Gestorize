<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->mergeDuplicateCatalogRows('categorias', 'nome', 'categoria_id', ['produtos', 'categoria_fornecedor', 'categoria_produto']);
        $this->mergeDuplicateCatalogRows('unidades_medida', 'sigla', 'unidade_medida_id', ['produtos']);

        foreach (['categorias', 'unidades_medida'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->dropForeign(['organization_id']);
                $table->dropIndex(['organization_id']);
                $table->dropColumn('organization_id');
            });
        }
    }

    public function down(): void
    {
        foreach (['categorias', 'unidades_medida'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->uuid('organization_id')->nullable()->index();
                $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            });
        }
    }

    /**
     * Merge rows copied to each tenant while keeping all product and supplier references valid.
     *
     * @param array<int, string> $pivotTables
     */
    private function mergeDuplicateCatalogRows(string $tableName, string $identityColumn, string $foreignKey, array $pivotTables): void
    {
        $rows = DB::table($tableName)->orderBy('id')->get(['id', $identityColumn]);
        $canonicalIds = [];

        foreach ($rows as $row) {
            $identity = mb_strtolower(trim((string) $row->{$identityColumn}));
            if (! isset($canonicalIds[$identity])) {
                $canonicalIds[$identity] = $row->id;
                continue;
            }

            $canonicalId = $canonicalIds[$identity];
            if (Schema::hasTable('produtos') && Schema::hasColumn('produtos', $foreignKey)) {
                DB::table('produtos')->where($foreignKey, $row->id)->update([$foreignKey => $canonicalId]);
            }

            foreach ($pivotTables as $pivotTable) {
                if ($pivotTable === 'produtos' || ! Schema::hasTable($pivotTable) || ! Schema::hasColumn($pivotTable, $foreignKey)) {
                    continue;
                }

                foreach (DB::table($pivotTable)->where($foreignKey, $row->id)->get() as $pivot) {
                    $replacement = (array) $pivot;
                    $replacement[$foreignKey] = $canonicalId;
                    DB::table($pivotTable)->insertOrIgnore($replacement);
                }
                DB::table($pivotTable)->where($foreignKey, $row->id)->delete();
            }

            DB::table($tableName)->where('id', $row->id)->delete();
        }
    }
};

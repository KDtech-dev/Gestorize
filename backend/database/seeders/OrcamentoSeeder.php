<?php

namespace Database\Seeders;

use App\Models\Orcamento;
use App\Models\OrcamentoItem;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class OrcamentoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $aprovadorId = User::query()->value('id');

        Orcamento::factory(20)->create()->each(function (Orcamento $orcamento, int $indice) use ($aprovadorId) {
            $dataCadastro = now()->subDays(($indice * 17) % 360);
            $aprovado = $indice % 3 === 0;

            $orcamento->forceFill([
                'titulo' => 'Orçamento ' . str_pad((string) ($indice + 1), 3, '0', STR_PAD_LEFT),
                'data_orcamento' => $dataCadastro->toDateString(),
                'created_at' => $dataCadastro,
                'updated_at' => $dataCadastro,
                'status' => $aprovado ? 'aprovado' : 'pendente',
                'aprovado_por' => $aprovado ? $aprovadorId : null,
                'aprovado_em' => $aprovado ? $dataCadastro : null,
            ])->save();

            $itens = OrcamentoItem::factory(rand(2, 5))->make([
                'orcamento_id' => $orcamento->id,
            ]);

            $orcamento->itens()->saveMany($itens);

            $orcamento->forceFill([
                'valor_total' => $orcamento->itens()->sum('subtotal'),
            ])->save();
        });
    }
}

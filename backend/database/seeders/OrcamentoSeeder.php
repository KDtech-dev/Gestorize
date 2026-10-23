<?php

namespace Database\Seeders;

use App\Models\Orcamento;
use App\Models\OrcamentoItem;
use App\Models\Cliente;
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

        $clienteId = Cliente::query()->orderBy('created_at')->value('id');

        foreach (range(0, 19) as $indice) {
            $dataCadastro = now()->subDays(($indice * 17) % 360);
            $aprovado = $indice % 3 === 0;

            $orcamento = Orcamento::updateOrCreate(
                ['titulo' => 'Orçamento ' . str_pad((string) ($indice + 1), 3, '0', STR_PAD_LEFT)],
                [
                    'cliente_id' => $clienteId,
                    'valor_total' => 0,
                    'data_orcamento' => $dataCadastro->toDateString(),
                ],
            );
            $orcamento->forceFill([
                'data_orcamento' => $dataCadastro->toDateString(),
                'created_at' => $dataCadastro,
                'updated_at' => $dataCadastro,
                'status' => $aprovado ? 'aprovado' : 'pendente',
                'aprovado_por' => $aprovado ? $aprovadorId : null,
                'aprovado_em' => $aprovado ? $dataCadastro : null,
            ])->save();

            $orcamento->itens()->delete();
            $itens = OrcamentoItem::factory(2 + ($indice % 4))->make([
                'orcamento_id' => $orcamento->id,
            ]);

            $orcamento->itens()->saveMany($itens);

            $orcamento->forceFill([
                'valor_total' => $orcamento->itens()->sum('subtotal'),
            ])->save();
        }
    }
}

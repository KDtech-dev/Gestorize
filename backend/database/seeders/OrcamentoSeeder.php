<?php

namespace Database\Seeders;

use App\Models\Orcamento;
use App\Models\OrcamentoItem;
use App\Models\Cliente;
use App\Models\Produto;
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

        $clientes = Cliente::query()->orderBy('email')->get();
        $totalProdutos = max(Produto::query()->count(), 1);

        foreach (range(0, 99) as $indice) {
            $dataCadastro = now()->subDays(($indice * 37) % 365);
            $aprovado = $indice % 3 === 0;
            $clienteId = $clientes[$indice % $clientes->count()]->id;

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
            $itens = Produto::query()->orderBy('id')->skip(($indice * 7) % $totalProdutos)->limit(2 + ($indice % 4))->get()
                ->map(function (Produto $produto, int $produtoIndex) use ($orcamento, $indice) {
                    $quantidade = 1 + (($indice + $produtoIndex * 3) % 10);
                    $precoUnitario = (float) $produto->preco_venda;

                    return new OrcamentoItem([
                        'orcamento_id' => $orcamento->id,
                        'produto_id' => $produto->id,
                        'quantidade' => $quantidade,
                        'preco_unitario' => $precoUnitario,
                        'subtotal' => round($quantidade * $precoUnitario, 2),
                    ]);
                });

            $orcamento->itens()->saveMany($itens);

            $orcamento->forceFill([
                'valor_total' => $orcamento->itens()->sum('subtotal'),
            ])->save();
        }
    }
}

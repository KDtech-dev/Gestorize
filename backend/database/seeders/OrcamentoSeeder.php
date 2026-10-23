<?php

namespace Database\Seeders;

use App\Models\Orcamento;
use App\Models\OrcamentoItem;
use App\Models\Cliente;
use App\Models\Produto;
use App\Models\User;
use Database\Seeders\Concerns\SeedsDefaultOrganization;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class OrcamentoSeeder extends Seeder
{
    use SeedsDefaultOrganization;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $organizationId = $this->defaultOrganization()->id;
        $aprovadorId = User::query()
            ->where('organization_id', $organizationId)
            ->where('email', 'gestor@example.com')
            ->value('id');

        $clientes = Cliente::query()->where('organization_id', $organizationId)->orderBy('email')->get();
        $totalProdutos = Produto::query()->where('organization_id', $organizationId)->count();

        if ($clientes->isEmpty() || $totalProdutos === 0) {
            throw new \RuntimeException('Execute ClientesSeeder e ProdutosSeeder antes de OrcamentoSeeder.');
        }

        foreach (range(0, 99) as $indice) {
            $dataCadastro = now()->subDays(($indice * 37) % 365);
            $aprovado = $indice % 3 === 0;
            $clienteId = $clientes[$indice % $clientes->count()]->id;

            $orcamento = $this->seedOrganizationRecord(Orcamento::class, $organizationId,
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
            $itens = Produto::query()->where('organization_id', $organizationId)->orderBy('id')->skip(($indice * 7) % $totalProdutos)->limit(2 + ($indice % 4))->get()
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

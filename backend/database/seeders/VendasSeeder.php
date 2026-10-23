<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Cliente;
use App\Models\Fornecedor;
use App\Models\Orcamento;
use App\Models\Produto;
use App\Models\UnidadeMedida;
use App\Models\User;
use App\Models\Venda;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VendasSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $usuarios = User::query()
                ->where(function ($query) {
                    $query->whereIn('email', ['funcionario@example.com', 'gestor@example.com', 'teste@email.com'])
                        ->orWhere('email', 'like', 'operador%@example.com');
                })
                ->orderBy('email')
                ->get();
            $funcionario = $usuarios->firstWhere('email', 'funcionario@example.com');
            if (!$funcionario || $usuarios->count() < 2) {
                throw new \RuntimeException('Execute TestUsersSeeder antes de VendasSeeder para criar os usuários de demonstração.');
            }

            $clientes = Cliente::query()->orderBy('created_at')->get();
            $cliente = $clientes->firstOrFail();

            $categoria = Categoria::firstOrCreate(['nome' => 'Alimentos']);
            $fornecedor = Fornecedor::updateOrCreate(
                ['cnpj' => '12.345.678/0001-90'],
                [
                    'nome' => 'Fornecedor Geral',
                    'email' => 'contato@fornecedor.com',
                    'telefone' => '(11) 99999-9999',
                    'nome_responsavel' => 'João Silva',
                ],
            );
            $fornecedor->categorias()->syncWithoutDetaching([$categoria->id]);

            $unidade = UnidadeMedida::firstOrCreate(
                ['sigla' => 'UN'],
                ['nome' => 'Unidade'],
            );

            $produto = Produto::updateOrCreate(
                ['codigo_barras' => 'DEMO-CAFE-500G-001'],
                [
                    'nome' => 'Café Especial 500g',
                    'descricao' => 'Produto utilizado no fluxo de demonstração de orçamento e venda.',
                    'preco_custo' => 18.00,
                    'porcentagem_lucro' => 50.00,
                    'preco_venda' => 27.00,
                    'estoque' => 500,
                    'data_entrada' => today()->toDateString(),
                    'validade' => today()->addMonths(8)->toDateString(),
                    'categoria_id' => $categoria->id,
                    'fornecedor_id' => $fornecedor->id,
                    'unidade_medida_id' => $unidade->id,
                ],
            );

            $quantidade = 2;
            $precoUnitario = (float) $produto->preco_venda;
            $subtotal = round($quantidade * $precoUnitario, 2);
            $orcamento = Orcamento::updateOrCreate(
                ['titulo' => 'Orçamento demonstração convertido em venda'],
                [
                    'cliente_id' => $cliente->id,
                    'valor_total' => $subtotal,
                    'data_orcamento' => today()->toDateString(),
                ],
            );
            $orcamento->forceFill([
                'status' => 'vendido',
                'aprovado_por' => $funcionario->id,
                'aprovado_em' => now(),
            ])->save();

            $orcamento->itens()->delete();
            $orcamento->itens()->create([
                'produto_id' => $produto->id,
                'quantidade' => $quantidade,
                'preco_unitario' => $precoUnitario,
                'subtotal' => $subtotal,
            ]);

            $venda = Venda::updateOrCreate(
                ['orcamento_id' => $orcamento->id],
                [
                    'usuario_id' => $funcionario->id,
                    'cliente_id' => $cliente->id,
                    'cliente_nome' => $cliente->nome,
                    'forma_pagamento' => 'pix',
                    'valor_total' => $subtotal,
                    'vendido_em' => now(),
                ],
            );
            $venda->itens()->delete();
            $venda->itens()->create([
                'produto_id' => $produto->id,
                'produto_nome' => $produto->nome,
                'codigo_barras' => $produto->codigo_barras,
                'quantidade' => $quantidade,
                'preco_unitario' => $precoUnitario,
                'subtotal' => $subtotal,
            ]);

            // O saldo inicial é redefinido acima para 500 em cada execução.
            $produto->decrement('estoque', $quantidade);

            $formasPagamento = ['pix', 'dinheiro', 'debito', 'credito'];
            $descontos = [0, 0, 0.03, 0.05, 0.08, 0.10];
            $totalUnidadesHistorico = 0;
            $usuarios = $usuarios->values();
            $clientes = $clientes->values();

            // 120 vendas determinísticas distribuídas ao longo dos últimos 12 meses.
            foreach (range(0, 119) as $indice) {
                $usuario = $usuarios[$indice % $usuarios->count()];
                $clienteVenda = $clientes[($indice * 7) % $clientes->count()];
                $vendidoEm = today()
                    ->subDays(($indice * 3) % 365)
                    ->setTime(6 + ($indice % 5), ($indice * 17) % 60);
                $quantidadeVenda = 1 + ($indice % 4);
                $subtotalVenda = round($quantidadeVenda * $precoUnitario, 2);
                $descontoVenda = round($subtotalVenda * $descontos[$indice % count($descontos)], 2);
                $totalUnidadesHistorico += $quantidadeVenda;
                $idVendaDemo = sprintf('00000000-0000-4000-8000-%012d', $indice + 1);

                $vendaDemonstracao = Venda::query()->firstOrNew(['id' => $idVendaDemo]);
                $vendaDemonstracao->forceFill([
                    'usuario_id' => $usuario->id,
                    'orcamento_id' => null,
                    'cliente_id' => $clienteVenda->id,
                    'cliente_nome' => $clienteVenda->nome,
                    'forma_pagamento' => $formasPagamento[$indice % count($formasPagamento)],
                    'desconto' => $descontoVenda,
                    'valor_total' => round($subtotalVenda - $descontoVenda, 2),
                    'vendido_em' => $vendidoEm,
                ])->save();
                $vendaDemonstracao->itens()->delete();
                $vendaDemonstracao->itens()->create([
                    'produto_id' => $produto->id,
                    'produto_nome' => $produto->nome,
                    'codigo_barras' => $produto->codigo_barras,
                    'quantidade' => $quantidadeVenda,
                    'preco_unitario' => $precoUnitario,
                    'subtotal' => $subtotalVenda,
                ]);
            }

            // Recalcula o estoque a partir do saldo inicial para manter o seeder idempotente.
            $produto->forceFill(['estoque' => max(0, 500 - $quantidade - $totalUnidadesHistorico)])->save();
        });
    }
}

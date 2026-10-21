<?php

namespace Database\Factories;

use App\Models\OrcamentoItem;
use App\Models\Produto;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrcamentoItemFactory extends Factory
{
    protected $model = OrcamentoItem::class;

    public function definition(): array
    {
        $produto       = Produto::inRandomOrder()->first() ?? Produto::factory()->create();
        $quantidade    = $this->faker->numberBetween(1, 10);
        $precoUnitario = $produto->preco_venda;
        $subtotal      = round($quantidade * $precoUnitario, 2);

        return [
            'orcamento_id'   => null, 
            'produto_id'     => $produto->id,
            'quantidade'     => $quantidade,
            'preco_unitario' => $precoUnitario,
            'subtotal'       => $subtotal,
        ];
    }
}

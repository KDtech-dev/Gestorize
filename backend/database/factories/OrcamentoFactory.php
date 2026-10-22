<?php

namespace Database\Factories;

use App\Models\Cliente;
use App\Models\Orcamento;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrcamentoFactory extends Factory
{
    protected $model = Orcamento::class;

    public function definition(): array
    {
        return [
            'titulo'        => 'Orçamento ' . $this->faker->unique()->bothify('####'),
            'cliente_id'    => Cliente::inRandomOrder()->value('id')
                                    ?? Cliente::factory(),
            'valor_total'   => 0,
            'data_orcamento' => $this->faker->dateTimeBetween('-6 months', 'now'),
        ];
    }
}

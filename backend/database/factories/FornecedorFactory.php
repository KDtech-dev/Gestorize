<?php

namespace Database\Factories;

use App\Models\Endereco;
use App\Models\Fornecedor;
use Illuminate\Database\Eloquent\Factories\Factory;

class FornecedorFactory extends Factory
{
    protected $model = Fornecedor::class;

    public function definition(): array
    {
        return [
            'nome'             => $this->faker->company(),
            'cnpj'             => $this->faker->numerify('##.###.###/####-##'),
            'email'            => $this->faker->companyEmail(),
            'telefone'         => $this->faker->numerify('(##) #####-####'),
            'nome_responsavel' => $this->faker->name(),
            'chave_pix'        => $this->faker->numerify('##.###.###/####-##'),
            'endereco_id'      => Endereco::factory(),
        ];
    }
}

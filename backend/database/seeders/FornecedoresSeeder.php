<?php

namespace Database\Seeders;

use App\Models\Fornecedor;
use Illuminate\Database\Seeder;

class FornecedoresSeeder extends Seeder
{
    public function run(): void
    {
        Fornecedor::create([
            'nome'            => 'Fornecedor Geral',
            'cnpj'            => '12.345.678/0001-90',
            'email'           => 'contato@fornecedor.com',
            'telefone'        => '(11) 99999-9999',
            'ramo_atividade'  => 'Distribuição Geral',
            'nome_responsavel' => 'João Silva',
        ]);

        Fornecedor::factory(9)->create();
    }
}

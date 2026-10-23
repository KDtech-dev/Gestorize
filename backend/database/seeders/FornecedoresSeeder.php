<?php

namespace Database\Seeders;

use App\Models\Fornecedor;
use App\Models\Categoria;
use Illuminate\Database\Seeder;

class FornecedoresSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = Categoria::all();
        $categoriasPorNome = $categorias->keyBy('nome');

        $fornecedor = Fornecedor::updateOrCreate(['cnpj' => '12.345.678/0001-90'], [
            'nome'            => 'Fornecedor Geral',
            'email'           => 'contato@fornecedor.com',
            'telefone'        => '(11) 99999-9999',
            'ramo_atividade'  => null,
            'nome_responsavel' => 'João Silva',
        ]);
        $fornecedor->categorias()->sync([
            $categoriasPorNome['Alimentos']->id,
            $categoriasPorNome['Bebidas']->id,
        ]);

        Fornecedor::factory(9)->create()->each(function (Fornecedor $fornecedor) use ($categorias) {
            $quantidade = random_int(1, min(3, $categorias->count()));
            $fornecedor->categorias()->sync($categorias->random($quantidade)->modelKeys());
        });
    }
}

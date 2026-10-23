<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoriasSeeder extends Seeder
{
    public function run()
    {
        foreach ([
            'Alimentos', 'Bebidas', 'Limpeza', 'Higiene Pessoal', 'Eletrônicos',
            'Roupas', 'Calçados', 'Móveis', 'Brinquedos', 'Ferramentas',
            'Insumos', 'Produtos médicos/hospitalares',
        ] as $nome) {
            Categoria::firstOrCreate(['nome' => $nome]);
        }
    }
}

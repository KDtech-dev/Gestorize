<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            RolesSeeder::class,
            UnidadesMedidaSeeder::class,
            CategoriasSeeder::class,
            TestUsersSeeder::class, 
            FornecedoresSeeder::class,
            ClientesSeeder::class,
            ProdutosSeeder::class,
            OrcamentoSeeder::class,
            VendasSeeder::class,
        ]);
    }
}

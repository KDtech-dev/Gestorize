<?php

namespace Database\Seeders;

use App\Models\Cliente;
use Illuminate\Database\Seeder;

class ClientesSeeder extends Seeder
{
    public function run(): void
    {
        $diasDesdeCadastro = [0, 2, 8, 20, 45, 90, 150, 240, 300, 360];

        foreach ($diasDesdeCadastro as $indice => $dias) {
            $cliente = $indice % 2 === 0
                ? Cliente::factory()->pf()->create()
                : Cliente::factory()->pj()->create();

            $dataCadastro = now()->subDays($dias);
            $cliente->forceFill([
                'created_at' => $dataCadastro,
                'updated_at' => $dataCadastro,
            ])->save();
        }
    }
}

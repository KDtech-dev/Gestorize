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
            $email = 'cliente.demo.' . ($indice + 1) . '@example.com';
            $atributos = [
                'nome' => 'Cliente de Demonstração ' . ($indice + 1),
                'email' => $email,
                'telefone' => sprintf('(11) 98888-%04d', $indice + 1),
            ];
            $cliente = Cliente::query()->where('email', $email)->first();
            if (!$cliente) {
                $cliente = $indice % 2 === 0
                    ? Cliente::factory()->pf()->create($atributos)
                    : Cliente::factory()->pj()->create($atributos);
            } else {
                $cliente->update($atributos);
            }

            $dataCadastro = now()->subDays($dias);
            $cliente->forceFill([
                'created_at' => $dataCadastro,
                'updated_at' => $dataCadastro,
            ])->save();
        }
    }
}

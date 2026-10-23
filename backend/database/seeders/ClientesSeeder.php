<?php

namespace Database\Seeders;

use App\Models\Cliente;
use Database\Seeders\Concerns\SeedsDefaultOrganization;
use Illuminate\Database\Seeder;

class ClientesSeeder extends Seeder
{
    use SeedsDefaultOrganization;

    public function run(): void
    {
        $organizationId = $this->defaultOrganization()->id;
        $diasDesdeCadastro = collect(range(0, 39))
            ->map(fn (int $indice) => ($indice * 9) % 365)
            ->sort()
            ->values();

        foreach ($diasDesdeCadastro as $indice => $dias) {
            $email = 'cliente.demo.' . ($indice + 1) . '@example.com';
            $atributos = [
                'nome' => 'Cliente de Demonstração ' . ($indice + 1),
                'email' => $email,
                'telefone' => sprintf('(11) 98888-%04d', $indice + 1),
            ];
            $cliente = Cliente::query()
                ->where('organization_id', $organizationId)
                ->where('email', $email)
                ->first();
            if (!$cliente) {
                $cliente = $indice % 2 === 0
                    ? Cliente::factory()->pf()->create($atributos)
                    : Cliente::factory()->pj()->create($atributos);
            } else {
                $cliente->update($atributos);
            }

            $cliente->forceFill(['organization_id' => $organizationId])->save();
            $cliente->dadosPf?->forceFill(['organization_id' => $organizationId])->save();
            $cliente->dadosPj?->forceFill(['organization_id' => $organizationId])->save();
            $cliente->endereco?->forceFill(['organization_id' => $organizationId])->save();
            $cliente->dadosPj?->endereco?->forceFill(['organization_id' => $organizationId])->save();

            $dataCadastro = now()->subDays($dias);
            $cliente->forceFill([
                'created_at' => $dataCadastro,
                'updated_at' => $dataCadastro,
            ])->save();
        }
    }
}

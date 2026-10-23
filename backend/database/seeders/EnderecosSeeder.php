<?php

namespace Database\Seeders;

use App\Models\Endereco;
use Database\Seeders\Concerns\SeedsDefaultOrganization;
use Illuminate\Database\Seeder;

class EnderecosSeeder extends Seeder
{
    use SeedsDefaultOrganization;

    public function run(): void
    {
        $organizationId = $this->defaultOrganization()->id;

        $this->seedOrganizationRecord(Endereco::class, $organizationId, ['cep' => '01001-000', 'numero' => '100'], [
            'logradouro'  => 'Praça da Sé',
            'numero'      => '100',
            'complemento' => 'Sala 1',
            'bairro'      => 'Sé',
            'cidade'      => 'São Paulo',
            'estado'      => 'SP',
        ]);

        $this->seedOrganizationRecord(Endereco::class, $organizationId, ['cep' => '20010-000', 'numero' => '200'], [
            'logradouro'  => 'Rua da Assembléia',
            'numero'      => '200',
            'bairro'      => 'Centro',
            'cidade'      => 'Rio de Janeiro',
            'estado'      => 'RJ',
        ]);

        $this->seedOrganizationRecord(Endereco::class, $organizationId, ['cep' => '30140-110', 'numero' => '1500'], [
            'logradouro'  => 'Av. Afonso Pena',
            'numero'      => '1500',
            'complemento' => 'Conj. 301',
            'bairro'      => 'Centro',
            'cidade'      => 'Belo Horizonte',
            'estado'      => 'MG',
        ]);
    }
}

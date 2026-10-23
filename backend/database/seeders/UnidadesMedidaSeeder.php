<?php

namespace Database\Seeders;

use App\Models\UnidadeMedida;
use Illuminate\Database\Seeder;

class UnidadesMedidaSeeder extends Seeder
{
    public function run()
    {
        UnidadeMedida::firstOrCreate(['sigla' => 'UN'], [
            'nome' => 'Unidade',
            'sigla' => 'UN'
        ]);

        UnidadeMedida::firstOrCreate(['sigla' => 'KG'], [
            'nome' => 'Quilograma',
            'sigla' => 'KG'
        ]);
        UnidadeMedida::firstOrCreate(['sigla' => 'G'], [
            'nome' => 'Grama',
            'sigla' => 'G'
        ]);

        UnidadeMedida::firstOrCreate(['sigla' => 'L'], [
            'nome' => 'Litro',
            'sigla' => 'L'
        ]);
        UnidadeMedida::firstOrCreate(['sigla' => 'ML'], [
            'nome' => 'Mililitro',
            'sigla' => 'ML'
        ]);

        UnidadeMedida::firstOrCreate(['sigla' => 'M'], [
            'nome' => 'Metro',
            'sigla' => 'M'
        ]);

        UnidadeMedida::firstOrCreate(['sigla' => 'CX'], [
            'nome' => 'Caixa',
            'sigla' => 'CX'
        ]);
        
        UnidadeMedida::firstOrCreate(['sigla' => 'PKG'], [
            'nome' => 'Pacote',
            'sigla' => 'PKG'
        ]);

        foreach ([
            'DZ' => 'Dúzia',
            'PAR' => 'Par',
            'FD' => 'Fardo',
            'SC' => 'Saco',
            'TB' => 'Tubo',
            'GL' => 'Galão',
        ] as $sigla => $nome) {
            UnidadeMedida::firstOrCreate(['sigla' => $sigla], ['nome' => $nome]);
        }
    }
}

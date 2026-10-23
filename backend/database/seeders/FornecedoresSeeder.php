<?php

namespace Database\Seeders;

use App\Models\Fornecedor;
use App\Models\Categoria;
use Database\Seeders\Concerns\SeedsDefaultOrganization;
use Illuminate\Database\Seeder;

class FornecedoresSeeder extends Seeder
{
    use SeedsDefaultOrganization;

    public function run(): void
    {
        $organizationId = $this->defaultOrganization()->id;
        $categorias = Categoria::all();
        $categoriasPorNome = $categorias->keyBy('nome');

        $fornecedor = $this->seedOrganizationRecord(Fornecedor::class, $organizationId, ['cnpj' => '12.345.678/0001-90'], [
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

        foreach (range(1, 15) as $indice) {
            $fornecedor = $this->seedOrganizationRecord(Fornecedor::class, $organizationId,
                ['cnpj' => sprintf('20.000.000/0001-%02d', $indice)],
                [
                    'nome' => "Fornecedor de Demonstração {$indice}",
                    'email' => "fornecedor{$indice}@example.com",
                    'telefone' => sprintf('(11) 90000-%04d', $indice),
                    'nome_responsavel' => "Responsável {$indice}",
                ],
            );
            $categoria = $categorias->get(($indice - 1) % max($categorias->count(), 1));
            if ($categoria) {
                $fornecedor->categorias()->sync([$categoria->id]);
            }
        }
    }
}

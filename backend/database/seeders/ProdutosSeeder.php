<?php

namespace Database\Seeders;

use App\Models\Produto;
use App\Models\Categoria;
use App\Models\UnidadeMedida;
use App\Models\Fornecedor;
use Illuminate\Database\Seeder;

class ProdutosSeeder extends Seeder
{
    public function run(): void
    {
        $alimentos  = Categoria::where('nome', 'Alimentos')->first()->id;
        $bebidas    = Categoria::where('nome', 'Bebidas')->first()->id;
        $limpeza    = Categoria::where('nome', 'Limpeza')->first()->id;
        $higiene    = Categoria::where('nome', 'Higiene Pessoal')->first()->id;
        $eletronicos = Categoria::where('nome', 'Eletrônicos')->first()->id;
        $roupas     = Categoria::where('nome', 'Roupas')->first()->id;
        $calcados   = Categoria::where('nome', 'Calçados')->first()->id;
        $moveis     = Categoria::where('nome', 'Móveis')->first()->id;
        $brinquedos = Categoria::where('nome', 'Brinquedos')->first()->id;
        $insumos = Categoria::where('nome', 'Insumos')->first()->id;
        $medicos = Categoria::where('nome', 'Produtos médicos/hospitalares')->first()->id;

        $un  = UnidadeMedida::where('sigla', 'UN')->first()->id;
        $kg  = UnidadeMedida::where('sigla', 'KG')->first()->id;
        $g   = UnidadeMedida::where('sigla', 'G')->first()->id;
        $l   = UnidadeMedida::where('sigla', 'L')->first()->id;
        $ml  = UnidadeMedida::where('sigla', 'ML')->first()->id;
        $cx  = UnidadeMedida::where('sigla', 'CX')->first()->id;
        $pkg = UnidadeMedida::where('sigla', 'PKG')->first()->id;

        $produtos = [
            // Alimentos
            ['nome' => 'Arroz Branco Tipo 1',     'descricao' => 'Pacote 5kg',             'preco_custo' => 18.00, 'porcentagem_lucro' => 30, 'preco_venda' => 23.40,  'estoque' => 150, 'categoria_id' => $alimentos,   'unidade_medida_id' => $kg],
            ['nome' => 'Feijão Carioca',           'descricao' => 'Pacote 1kg',             'preco_custo' => 8.00,  'porcentagem_lucro' => 35, 'preco_venda' => 10.80,  'estoque' => 120, 'categoria_id' => $alimentos,   'unidade_medida_id' => $kg],
            ['nome' => 'Macarrão Espaguete',       'descricao' => 'Pacote 500g',            'preco_custo' => 3.50,  'porcentagem_lucro' => 40, 'preco_venda' => 4.90,   'estoque' => 200, 'categoria_id' => $alimentos,   'unidade_medida_id' => $pkg],
            ['nome' => 'Óleo de Soja',             'descricao' => 'Garrafa 900ml',          'preco_custo' => 6.00,  'porcentagem_lucro' => 30, 'preco_venda' => 7.80,   'estoque' => 100, 'categoria_id' => $alimentos,   'unidade_medida_id' => $ml],
            ['nome' => 'Açúcar Cristal',           'descricao' => 'Pacote 1kg',             'preco_custo' => 4.00,  'porcentagem_lucro' => 35, 'preco_venda' => 5.40,   'estoque' => 180, 'categoria_id' => $alimentos,   'unidade_medida_id' => $kg],
            ['nome' => 'Farinha de Trigo',         'descricao' => 'Pacote 1kg',             'preco_custo' => 3.80,  'porcentagem_lucro' => 30, 'preco_venda' => 4.94,   'estoque' => 160, 'categoria_id' => $alimentos,   'unidade_medida_id' => $kg],

            // Bebidas
            ['nome' => 'Água Mineral 500ml',       'descricao' => 'Garrafa 500ml',          'preco_custo' => 1.00,  'porcentagem_lucro' => 50, 'preco_venda' => 1.50,   'estoque' => 300, 'categoria_id' => $bebidas,     'unidade_medida_id' => $ml],
            ['nome' => 'Refrigerante Cola 2L',     'descricao' => 'Garrafa 2 litros',       'preco_custo' => 6.00,  'porcentagem_lucro' => 40, 'preco_venda' => 8.40,   'estoque' => 120, 'categoria_id' => $bebidas,     'unidade_medida_id' => $l],
            ['nome' => 'Suco de Laranja 1L',       'descricao' => 'Caixa longa vida',       'preco_custo' => 4.50,  'porcentagem_lucro' => 45, 'preco_venda' => 6.53,   'estoque' => 90,  'categoria_id' => $bebidas,     'unidade_medida_id' => $l],
            ['nome' => 'Cerveja Lata 350ml',       'descricao' => 'Lata 350ml',             'preco_custo' => 2.50,  'porcentagem_lucro' => 50, 'preco_venda' => 3.75,   'estoque' => 240, 'categoria_id' => $bebidas,     'unidade_medida_id' => $ml],

            // Limpeza
            ['nome' => 'Detergente Líquido',       'descricao' => 'Frasco 500ml',           'preco_custo' => 2.00,  'porcentagem_lucro' => 50, 'preco_venda' => 3.00,   'estoque' => 200, 'categoria_id' => $limpeza,     'unidade_medida_id' => $ml],
            ['nome' => 'Água Sanitária',           'descricao' => 'Frasco 1L',              'preco_custo' => 3.00,  'porcentagem_lucro' => 40, 'preco_venda' => 4.20,   'estoque' => 150, 'categoria_id' => $limpeza,     'unidade_medida_id' => $l],
            ['nome' => 'Sabão em Pó',              'descricao' => 'Caixa 1kg',              'preco_custo' => 8.00,  'porcentagem_lucro' => 35, 'preco_venda' => 10.80,  'estoque' => 100, 'categoria_id' => $limpeza,     'unidade_medida_id' => $kg],
            ['nome' => 'Esponja de Limpeza',       'descricao' => 'Pacote com 3 unidades',  'preco_custo' => 2.50,  'porcentagem_lucro' => 60, 'preco_venda' => 4.00,   'estoque' => 180, 'categoria_id' => $limpeza,     'unidade_medida_id' => $pkg],

            // Higiene Pessoal
            ['nome' => 'Shampoo 400ml',            'descricao' => 'Frasco 400ml',           'preco_custo' => 9.00,  'porcentagem_lucro' => 45, 'preco_venda' => 13.05,  'estoque' => 80,  'categoria_id' => $higiene,     'unidade_medida_id' => $ml],
            ['nome' => 'Sabonete em Barra',        'descricao' => 'Unidade 90g',            'preco_custo' => 2.00,  'porcentagem_lucro' => 50, 'preco_venda' => 3.00,   'estoque' => 250, 'categoria_id' => $higiene,     'unidade_medida_id' => $g],
            ['nome' => 'Creme Dental 90g',         'descricao' => 'Tubo 90g',               'preco_custo' => 4.00,  'porcentagem_lucro' => 40, 'preco_venda' => 5.60,   'estoque' => 130, 'categoria_id' => $higiene,     'unidade_medida_id' => $g],
            ['nome' => 'Desodorante Aerossol',     'descricao' => 'Frasco 150ml',           'preco_custo' => 8.00,  'porcentagem_lucro' => 50, 'preco_venda' => 12.00,  'estoque' => 90,  'categoria_id' => $higiene,     'unidade_medida_id' => $ml],

            // Eletrônicos
            ['nome' => 'Carregador USB-C',         'descricao' => 'Carregador 20W',         'preco_custo' => 25.00, 'porcentagem_lucro' => 60, 'preco_venda' => 40.00,  'estoque' => 50,  'categoria_id' => $eletronicos, 'unidade_medida_id' => $un],
            ['nome' => 'Fone de Ouvido Bluetooth', 'descricao' => 'Sem fio, bateria 20h',  'preco_custo' => 60.00, 'porcentagem_lucro' => 65, 'preco_venda' => 99.00,  'estoque' => 30,  'categoria_id' => $eletronicos, 'unidade_medida_id' => $un],
            ['nome' => 'Cabo HDMI 2m',             'descricao' => 'Cabo 2 metros 4K',       'preco_custo' => 15.00, 'porcentagem_lucro' => 60, 'preco_venda' => 24.00,  'estoque' => 40,  'categoria_id' => $eletronicos, 'unidade_medida_id' => $un],

            // Roupas
            ['nome' => 'Camiseta Básica',          'descricao' => 'Algodão, tamanho M',     'preco_custo' => 20.00, 'porcentagem_lucro' => 80, 'preco_venda' => 36.00,  'estoque' => 60,  'categoria_id' => $roupas,      'unidade_medida_id' => $un],
            ['nome' => 'Calça Jeans',              'descricao' => 'Jeans slim, tamanho 40', 'preco_custo' => 60.00, 'porcentagem_lucro' => 70, 'preco_venda' => 102.00, 'estoque' => 40,  'categoria_id' => $roupas,      'unidade_medida_id' => $un],
            ['nome' => 'Meia Cano Curto',          'descricao' => 'Par, tamanho único',     'preco_custo' => 5.00,  'porcentagem_lucro' => 60, 'preco_venda' => 8.00,   'estoque' => 150, 'categoria_id' => $roupas,      'unidade_medida_id' => $un],

            // Calçados
            ['nome' => 'Tênis Casual',             'descricao' => 'Solado emborrachado 41', 'preco_custo' => 80.00, 'porcentagem_lucro' => 75, 'preco_venda' => 140.00, 'estoque' => 25,  'categoria_id' => $calcados,    'unidade_medida_id' => $un],
            ['nome' => 'Sandália Feminina',        'descricao' => 'Tiras ajustáveis n.37',  'preco_custo' => 40.00, 'porcentagem_lucro' => 70, 'preco_venda' => 68.00,  'estoque' => 30,  'categoria_id' => $calcados,    'unidade_medida_id' => $un],

            // Móveis
            ['nome' => 'Cadeira de Escritório',    'descricao' => 'Com rodízios e braços',  'preco_custo' => 250.00, 'porcentagem_lucro' => 60, 'preco_venda' => 400.00, 'estoque' => 10,  'categoria_id' => $moveis,      'unidade_medida_id' => $un],
            ['nome' => 'Mesa de Jantar 4 Lugares', 'descricao' => 'MDF com tampo de vidro', 'preco_custo' => 400.00, 'porcentagem_lucro' => 55, 'preco_venda' => 620.00, 'estoque' => 5,   'categoria_id' => $moveis,      'unidade_medida_id' => $un],

            // Brinquedos
            ['nome' => 'Boneca de Pano',           'descricao' => 'Altura 30cm',            'preco_custo' => 15.00, 'porcentagem_lucro' => 65, 'preco_venda' => 24.75,  'estoque' => 45,  'categoria_id' => $brinquedos,  'unidade_medida_id' => $un],
            ['nome' => 'Carrinho de Controle',     'descricao' => 'Remoto, escala 1:18',    'preco_custo' => 50.00, 'porcentagem_lucro' => 60, 'preco_venda' => 80.00,  'estoque' => 20,  'categoria_id' => $brinquedos,  'unidade_medida_id' => $un],

            // Insumos e produtos médicos/hospitalares
            ['nome' => 'Insumo para Limpeza Profissional', 'descricao' => 'Embalagem concentrada 1L', 'preco_custo' => 18.00, 'porcentagem_lucro' => 45, 'preco_venda' => 26.10, 'estoque' => 25, 'categoria_id' => $insumos, 'unidade_medida_id' => $l],
            ['nome' => 'Luvas de Procedimento', 'descricao' => 'Caixa com 100 unidades', 'preco_custo' => 22.00, 'porcentagem_lucro' => 50, 'preco_venda' => 33.00, 'estoque' => 40, 'categoria_id' => $medicos, 'unidade_medida_id' => $cx],
            ['nome' => 'Gaze Estéril', 'descricao' => 'Pacote hospitalar', 'preco_custo' => 7.00, 'porcentagem_lucro' => 55, 'preco_venda' => 10.85, 'estoque' => 60, 'categoria_id' => $medicos, 'unidade_medida_id' => $un],
        ];

        $hoje = now();
        $validadeOffsets = [-45, -10, -1, 0, 7, 15, 30, 60, 90, 180, 365];
        $categoriasComValidade = [$alimentos, $bebidas, $higiene, $insumos, $medicos];

        foreach ($produtos as $indice => $produto) {
            $dataCadastro = $hoje->copy()->subDays(($indice * 11) % 360);
            $temValidade = in_array($produto['categoria_id'], $categoriasComValidade, true);
            $validadeOffset = $validadeOffsets[$indice % count($validadeOffsets)];
            $validade = $temValidade ? $hoje->copy()->addDays($validadeOffset) : null;
            $diasDesdeEntrada = $temValidade && $validadeOffset < 0
                ? abs($validadeOffset) + random_int(1, 30)
                : random_int(0, 60);
            $fornecedorId = Fornecedor::query()->orderBy('cnpj')->skip($indice % max(Fornecedor::count(), 1))->value('id');
            $registro = Produto::updateOrCreate(['nome' => $produto['nome']], array_merge($produto, [
                'data_entrada' => $hoje->copy()->subDays($diasDesdeEntrada)->toDateString(),
                'validade' => $validade?->toDateString(),
                'fornecedor_id' => $fornecedorId,
            ]));

            $registro->forceFill([
                'created_at' => $dataCadastro,
                'updated_at' => $dataCadastro,
            ])->save();
        }
    }
}

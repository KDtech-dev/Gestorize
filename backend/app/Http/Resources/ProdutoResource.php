<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProdutoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,
            'nome' => $this->nome,
            'codigo_barras' => $this->codigo_barras,
            'descricao' => $this->descricao,
            'preco_custo' => $this->preco_custo,
            'porcentagem_lucro' => $this->porcentagem_lucro,
            'preco_venda' => $this->preco_venda,
            'estoque' => $this->estoque,
            'data_entrada' => $this->data_entrada,
            'validade' => $this->validade,
            'categoria_id' => $this->categoria_id,
            'categoria_titulo' => $this->categoria?->nome,
            'fornecedor_id' => $this->fornecedor_id,
            'fornecedor_razao_social' => $this->fornecedor?->nome,
            'unidade_medida_id' => $this->unidade_medida_id,
            'unidade_medida_titulo' => $this->unidadeMedida?->nome,
            'unidade_medida_sigla' => $this->unidadeMedida?->sigla,
            'imagem_principal' => $this->imagemPrincipal
                ? new ProdutoImagemResource($this->imagemPrincipal)
                : null,
            'imagens' => ProdutoImagemResource::collection(
                $this->whenLoaded('imagens')
            ),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

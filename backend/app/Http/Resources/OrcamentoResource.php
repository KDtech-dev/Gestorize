<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrcamentoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'cliente_id' => $this->cliente_id,
            'cliente' => $this->whenLoaded(
                'cliente',
                fn () => new ClienteResource($this->cliente)
            ),
            'valor_total' => $this->valor_total,
            'status' => $this->status,
            'aprovado_por' => $this->aprovado_por,
            'aprovado_em' => $this->aprovado_em,
            'aprovador_nome' => $this->aprovador?->name,
            'data_orcamento' => $this->data_orcamento,
            'itens' => OrcamentoItemResource::collection(
                $this->whenLoaded('itens')
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

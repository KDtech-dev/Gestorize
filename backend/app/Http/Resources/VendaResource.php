<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'valor_total' => $this->valor_total,
            'vendido_em' => $this->vendido_em,
            'vendedor' => $this->usuario?->name,
            'cliente_id' => $this->cliente_id,
            'orcamento_id' => $this->orcamento_id,
            'cliente_nome' => $this->cliente_nome ?? $this->cliente?->nome,
            'forma_pagamento' => $this->forma_pagamento,
            'itens' => VendaItemResource::collection($this->whenLoaded('itens')),
        ];
    }
}

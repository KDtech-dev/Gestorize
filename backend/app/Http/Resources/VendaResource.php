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
            'usuario_id' => $this->usuario_id,
            'vendedor' => $this->usuario?->name,
            'cliente_id' => $this->cliente_id,
            'orcamento_id' => $this->orcamento_id,
            'cliente_nome' => $this->cliente_nome ?? $this->cliente?->nome,
            'forma_pagamento' => $this->forma_pagamento,
            'desconto' => $this->desconto,
            'status' => $this->status ?? 'concluida',
            'estornada_em' => $this->estornada_em,
            'estornada_por' => $this->estornadaPor?->name,
            'estornada_por_id' => $this->estornada_por,
            'estornada_autorizada_por' => $this->estornada_autorizada_nome ?? $this->estornadaAutorizadaPor?->name,
            'estornada_autorizada_por_id' => $this->estornada_autorizada_por,
            'itens' => VendaItemResource::collection($this->whenLoaded('itens')),
        ];
    }
}

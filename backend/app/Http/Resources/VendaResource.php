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
            'itens' => VendaItemResource::collection($this->whenLoaded('itens')),
        ];
    }
}

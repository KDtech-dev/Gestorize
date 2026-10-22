<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendaItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'produto_id' => $this->produto_id,
            'produto_nome' => $this->produto_nome,
            'codigo_barras' => $this->codigo_barras,
            'quantidade' => $this->quantidade,
            'preco_unitario' => $this->preco_unitario,
            'subtotal' => $this->subtotal,
        ];
    }
}

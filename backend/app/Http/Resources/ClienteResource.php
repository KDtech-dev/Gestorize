<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClienteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'tipo' => $this->tipo,
            'email' => $this->email,
            'telefone' => $this->telefone,
            'avatar_url' => $this->avatar_url,

            'endereco' => $this->whenLoaded(
                'endereco',
                fn() => $this->endereco
            ),

            'pf' => $this->whenLoaded(
                'dadosPf',
                fn() => $this->dadosPf
            ),

            'pj' => $this->whenLoaded(
                'dadosPj',
                fn() => $this->dadosPj
            ),
            'orcamentos' => $this->whenLoaded(
                'orcamentos',
                fn() => $this->orcamentos->map(fn ($orcamento) => [
                    'id' => $orcamento->id,
                    'titulo' => $orcamento->titulo,
                    'status' => $orcamento->status,
                    'valor_total' => $orcamento->valor_total,
                    'data_orcamento' => $orcamento->data_orcamento,
                ])->values()
            ),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar_url' => $this->avatar_url,
            'role' => $this->getRoleNames()->first(),
            'permissions' => $this->getAllPermissions()
                ->pluck('name')
                ->unique()
                ->values(),
            'funcionario' => $this->whenLoaded(
                'funcionario',
                fn () => $this->funcionario ? [
                    'telefone' => $this->funcionario->telefone,
                    'cpf' => $this->funcionario->cpf,
                    'data_nascimento' => $this->funcionario->data_nascimento,
                    'endereco' => $this->funcionario->endereco
                        ? new EnderecoResource($this->funcionario->endereco)
                        : null,
                ] : null
            ),
        ];
    }
}

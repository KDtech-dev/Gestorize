<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FuncionarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'telefone' => $this->telefone,
            'cpf' => $this->cpf,
            'data_nascimento' => $this->data_nascimento,
            'avatar_url' => $this->whenLoaded(
                'user',
                fn() => $this->user?->avatar_url
            ),
            'nome' => $this->whenLoaded(
                'user',
                fn() => $this->user?->name
            ),
            'email' => $this->whenLoaded(
                'user',
                fn() => $this->user?->email
            ),
            'role' => $this->whenLoaded(
                'user',
                fn() => $this->user?->getRoleNames()->first()
            ),
            'endereco' => $this->whenLoaded(
                'endereco',
                fn() => $this->endereco
                    ? new EnderecoResource($this->endereco)
                    : null
            ),
            'permissions' => $this->whenLoaded(
                'user',
                fn() => $this->user->getDirectPermissions()->pluck('name')->values()->all(),
                []
            ),
            'role_permissions' => $this->whenLoaded(
                'user',
                fn() => $this->user->getPermissionsViaRoles()->pluck('name')->unique()->values()->all(),
                []
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

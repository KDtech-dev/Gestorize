<?php

namespace App\Http\Resources;

use App\Enums\PermissionEnum;
use App\Enums\RoleEnum;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $role = RoleEnum::tryFrom($this->name);

        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'label'       => $role?->label() ?? $this->name,
            'permissions' => $this->permissions
                ->map(fn($p) => PermissionEnum::tryFrom($p->name)?->nome() ?? 'Outros')
                ->unique()
                ->values(),
            'permission_ids' => $this->permissions
                ->pluck('name')
                ->unique()
                ->values(),
        ];
    }
}

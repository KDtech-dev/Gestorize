<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Enums\RoleEnum;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Concerns\BelongsToOrganization;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasRoles, HasFactory, Notifiable, HasUuids, BelongsToOrganization;

    protected $guard_name = 'api';
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'name',
        'email',
        'password',
        'api_token',
        'avatar',
        'organization_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'api_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }


    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar) {
            return null;
        }

        return Storage::disk('public')->url($this->avatar);
    }

    public function funcionario(): HasOne
    {
        return $this->hasOne(Funcionario::class, 'id', 'id');
    }

    public function getRoleEnumAttribute(): ?RoleEnum
    {
        $roleName = $this->getRoleNames()->first();

        return match ($roleName) {
            'admin' => RoleEnum::ADMIN,
            'gestor' => RoleEnum::GESTOR,
            'funcionario' => RoleEnum::FUNCIONARIO,
            default => null,
        };
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isGestor(): bool
    {
        return $this->hasRole('gestor');
    }

    public function isFuncionario(): bool
    {
        return $this->hasRole('funcionario');
    }
}

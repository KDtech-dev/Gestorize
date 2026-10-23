<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use App\Models\Concerns\BelongsToOrganization;

class Funcionario extends Model
{
    use BelongsToOrganization;

    protected static function booted(): void
    {
        static::addGlobalScope('funcionario_user_organization', function ($query): void {
            if (Auth::check()) {
                $query->whereHas('user', fn ($users) => $users->where('organization_id', Auth::user()->organization_id));
            }
        });
    }

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'telefone',
        'data_nascimento',
        'cpf',
        'endereco_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id', 'id');
    }

    public function endereco(): BelongsTo
    {
        return $this->belongsTo(Endereco::class);
    }
}

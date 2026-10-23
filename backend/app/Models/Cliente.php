<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use App\Models\Concerns\BelongsToOrganization;

class Cliente extends Model
{
    use HasUuids, HasFactory, BelongsToOrganization;

    protected $fillable = [
        'nome',
        'tipo',
        'email',
        'telefone',
        'endereco_id',
        'avatar',
    ];

    protected $appends = [
        'avatar_url',
    ];

    protected function avatarUrl(): Attribute
    {
        return Attribute::get(
            fn() => $this->avatar
                ? url(Storage::disk('public')->url($this->avatar))
                : null
        );
    }

    public function endereco()
    {
        return $this->belongsTo(Endereco::class);
    }

    public function orcamentos()
    {
        return $this->hasMany(Orcamento::class);
    }

    public function dadosPf()
    {
        return $this->hasOne(ClientePf::class);
    }

    public function dadosPj()
    {
        return $this->hasOne(ClientePj::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Support\Facades\Storage;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fornecedor extends Model
{
    use HasUuids, HasFactory, BelongsToOrganization;

    protected $table = 'fornecedores';

    protected $fillable = [
        'nome',
        'cnpj',
        'email',
        'telefone',
        'ramo_atividade',
        'nome_responsavel',
        'chave_pix',
        'endereco_id',
        'avatar',
    ];

    protected $appends = [
        'avatar_url',
    ];
    protected $hidden = [
        'avatar',
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

    public function categorias()
    {
        return $this->belongsToMany(Categoria::class, 'categoria_fornecedor')
            ->withTimestamps();
    }
}

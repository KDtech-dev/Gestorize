<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToOrganization;

class ClientePj extends Model
{
    use HasUuids, HasFactory, BelongsToOrganization;

    protected $table = 'clientes_pj';

    protected $fillable = [
        'cliente_id',
        'cnpj',
        'razao_social',
        'nome_fantasia',
        'nome_responsavel',
        'cpf_responsavel',
        'cargo_responsavel',
        'endereco_id',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function endereco()
    {
        return $this->belongsTo(Endereco::class);
    }
}

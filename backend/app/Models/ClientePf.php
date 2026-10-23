<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToOrganization;

class ClientePf extends Model
{
    use HasUuids, HasFactory, BelongsToOrganization;

    protected $table = 'clientes_pf';

    protected $fillable = [
        'cliente_id',
        'genero',
        'rg',
        'cpf',
        'data_nascimento',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UnidadeMedida extends Model
{
    use HasUuids;
    protected $table = 'unidades_medida';

    protected $fillable = [
        'nome',
        'sigla',
    ];
}

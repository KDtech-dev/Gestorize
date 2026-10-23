<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToOrganization;

class UnidadeMedida extends Model
{
    use HasUuids, BelongsToOrganization;
    protected $table = 'unidades_medida';

    protected $fillable = [
        'nome',
        'sigla',
    ];
}

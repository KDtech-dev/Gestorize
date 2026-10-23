<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToOrganization;

class Categoria extends Model
{
    use HasUuids, BelongsToOrganization;

    protected $fillable = [
        'nome',
    ];
}

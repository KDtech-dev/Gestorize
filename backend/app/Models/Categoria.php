<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    use HasUuids;

    protected $fillable = [
        'nome',
    ];
}

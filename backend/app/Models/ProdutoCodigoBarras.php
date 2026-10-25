<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProdutoCodigoBarras extends Model
{
    use HasUuids, BelongsToOrganization;

    protected $table = 'produto_codigos_barras';

    protected $fillable = ['produto_id', 'codigo', 'tipo'];

    public function produto()
    {
        return $this->belongsTo(Produto::class);
    }
}

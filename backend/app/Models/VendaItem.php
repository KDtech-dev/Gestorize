<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VendaItem extends Model
{
    use HasUuids;

    protected $table = 'venda_itens';

    protected $fillable = [
        'venda_id', 'produto_id', 'produto_nome', 'codigo_barras',
        'quantidade', 'preco_unitario', 'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'quantidade' => 'integer',
            'preco_unitario' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    public function produto()
    {
        return $this->belongsTo(Produto::class);
    }
}

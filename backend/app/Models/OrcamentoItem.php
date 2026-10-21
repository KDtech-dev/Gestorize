<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrcamentoItem extends Model
{
    use HasUuids , HasFactory;

    protected $table = 'orcamento_produtos';

    protected $fillable = [
        'orcamento_id',
        'produto_id',
        'quantidade',
        'preco_unitario',
        'subtotal',
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

    public function orcamento()
    {
        return $this->belongsTo(Orcamento::class);
    }
}

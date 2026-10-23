<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Concerns\BelongsToOrganization;

class Orcamento extends Model
{
    use HasUuids , HasFactory, BelongsToOrganization;

    protected $fillable = [
        'titulo',
        'cliente_id',
        'valor_total',
        'data_orcamento',
    ];

    protected function casts(): array
    {
        return [
            'valor_total' => 'decimal:2',
            'data_orcamento' => 'date:Y-m-d',
            'aprovado_em' => 'datetime',
        ];
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function aprovador()
    {
        return $this->belongsTo(User::class, 'aprovado_por');
    }

    public function venda()
    {
        return $this->hasOne(Venda::class);
    }

    public function itens()
    {
        return $this->hasMany(OrcamentoItem::class);
    }

    public function produtos()
    {
        return $this->belongsToMany(Produto::class, 'orcamento_produtos')
            ->withPivot(['id', 'quantidade', 'preco_unitario', 'subtotal'])
            ->withTimestamps();
    }
}

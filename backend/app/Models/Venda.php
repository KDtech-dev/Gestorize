<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Venda extends Model
{
    use HasUuids;

    protected $fillable = ['usuario_id', 'cliente_id', 'orcamento_id', 'cliente_nome', 'forma_pagamento', 'valor_total', 'vendido_em'];

    protected function casts(): array
    {
        return ['valor_total' => 'decimal:2', 'vendido_em' => 'datetime'];
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function orcamento()
    {
        return $this->belongsTo(Orcamento::class);
    }

    public function itens()
    {
        return $this->hasMany(VendaItem::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Produto extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'nome',
        'descricao',
        'preco_custo',
        'porcentagem_lucro',
        'preco_venda',
        'data_entrada',
        'categoria_id',
        'fornecedor_id',
        'unidade_medida_id',
        'estoque',
        'validade'
    ];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function categorias()
    {
        return $this->belongsToMany(Categoria::class, 'categoria_produto')
            ->withPivot('is_principal')
            ->orderByPivot('is_principal', 'desc');
    }

    public function fornecedor()
    {
        return $this->belongsTo(Fornecedor::class);
    }

    public function unidadeMedida()
    {
        return $this->belongsTo(UnidadeMedida::class);
    }

    public function imagens()
    {
        return $this->hasMany(ProdutoImagem::class);
    }

    public function imagemPrincipal()
    {
        return $this->hasOne(ProdutoImagem::class)
            ->where('principal', true);
    }

    public function orcamentoItens()
    {
        return $this->hasMany(OrcamentoItem::class);
    }

    public function orcamentos()
    {
        return $this->belongsToMany(Orcamento::class, 'orcamento_produtos')
            ->withPivot(['id', 'quantidade', 'preco_unitario', 'subtotal'])
            ->withTimestamps();
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Models\Concerns\BelongsToOrganization;

class Produto extends Model
{
    use HasUuids, HasFactory, BelongsToOrganization;

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
        'validade',
        'codigo_barras',
    ];

    protected static function booted(): void
    {
        static::creating(function (Produto $produto) {
            if (blank($produto->codigo_barras)) {
                do {
                    $codigo = 'PRD' . strtoupper(Str::random(9));
                } while (static::where('codigo_barras', $codigo)->exists());

                $produto->codigo_barras = $codigo;
            }
        });
    }

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

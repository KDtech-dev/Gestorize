<?php

namespace App\Rules;

use App\Models\Produto;
use App\Models\ProdutoCodigoBarras;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Auth;

class UniqueProductBarcode implements ValidationRule
{
    public function __construct(private ?string $produtoId = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $organizationId = Auth::user()?->organization_id;
        if (!is_string($value) || !$organizationId) return;

        $usedByLegacy = Produto::withoutGlobalScopes()
            ->where('organization_id', $organizationId)
            ->where('codigo_barras', $value)
            ->when($this->produtoId, fn ($query) => $query->where('id', '!=', $this->produtoId))
            ->exists();
        $usedByAdditional = ProdutoCodigoBarras::withoutGlobalScopes()
            ->where('organization_id', $organizationId)
            ->where('codigo', $value)
            ->when($this->produtoId, fn ($query) => $query->where('produto_id', '!=', $this->produtoId))
            ->exists();

        if ($usedByLegacy || $usedByAdditional) {
            $fail('Este código de barras já está associado a outro produto desta organização.');
        }
    }
}

<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

class BelongsToCurrentOrganization implements ValidationRule
{
    private const GLOBAL_TABLES = ['categorias', 'unidades_medida'];

    public function __construct(private string $table, private string $column = 'id') {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $organizationId = request()->user()?->organization_id;
        $query = DB::table($this->table)->where($this->column, $value);
        if (! in_array($this->table, self::GLOBAL_TABLES, true)) {
            if (! $organizationId) {
                $fail('O registro selecionado não pertence à sua organização.');

                return;
            }

            $query->where('organization_id', $organizationId);
        }

        $exists = $query->exists();

        if (! $exists) {
            $fail('O registro selecionado não pertence à sua organização.');
        }
    }
}

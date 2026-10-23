<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

class BelongsToCurrentOrganization implements ValidationRule
{
    public function __construct(private string $table, private string $column = 'id') {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $organizationId = request()->user()?->organization_id;
        $exists = $organizationId && DB::table($this->table)
            ->where('organization_id', $organizationId)
            ->where($this->column, $value)
            ->exists();

        if (! $exists) {
            $fail('O registro selecionado não pertence à sua organização.');
        }
    }
}

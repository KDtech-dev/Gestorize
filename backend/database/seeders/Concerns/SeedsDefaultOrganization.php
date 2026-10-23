<?php

namespace Database\Seeders\Concerns;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Model;

trait SeedsDefaultOrganization
{
    protected function defaultOrganization(): Organization
    {
        return Organization::query()->firstOrCreate(
            ['name' => 'Organização padrão'],
            ['active' => true],
        );
    }

    /** @param class-string<Model> $modelClass */
    protected function seedOrganizationRecord(
        string $modelClass,
        string $organizationId,
        array $identity,
        array $attributes,
    ): Model {
        /** @var Model $record */
        $record = $modelClass::query()
            ->where('organization_id', $organizationId)
            ->firstOrNew($identity);

        $record->fill($attributes);
        $record->forceFill(['organization_id' => $organizationId]);
        $record->save();

        return $record;
    }
}

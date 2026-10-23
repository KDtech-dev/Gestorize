<?php

namespace App\Models\Concerns;

use App\Models\Organization;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToOrganization
{
    protected static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope('organization', function (Builder $builder): void {
            $user = Auth::user();
            if (! $user) {
                return;
            }

            $builder->where(
                $builder->getModel()->qualifyColumn('organization_id'),
                $user->organization_id,
            );
        });

        static::creating(function ($model): void {
            if (Auth::check() && blank($model->organization_id)) {
                $model->organization_id = Auth::user()->organization_id;
            } elseif (! Auth::check() && blank($model->organization_id) && Schema::hasTable('organizations')) {
                $model->organization_id = Organization::query()->value('id');
            }
        });
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}

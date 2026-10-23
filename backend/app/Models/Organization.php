<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'document', 'email', 'phone', 'settings', 'active'];

    protected function casts(): array
    {
        return ['settings' => 'array', 'active' => 'boolean'];
    }

    public function users()
    {
        return $this->hasMany(User::class)->withoutGlobalScope('organization');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Funcionario;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;

class OrganizationController extends Controller
{
    public function index()
    {
        $organizations = Organization::withCount('users')->latest()->get();
        $organizations->each(function (Organization $organization) {
            $managers = $organization->users()->role('gestor')->get(['id', 'name', 'email']);
            $settings = $organization->settings ?? [];
            $selectedManagerId = $settings['manager_id'] ?? $managers->first()?->id;
            $organization->setAttribute('managers', $managers);
            $organization->setAttribute('manager_id', $selectedManagerId);
        });

        return response()->json(['success' => true, 'data' => $organizations]);
    }

    public function metrics()
    {
        $organizations = Organization::query()->withCount('users')->orderBy('name')->get();
        $activeOrganizationIds = $organizations->where('active', true)->pluck('id');
        $inactiveOrganizationIds = $organizations->where('active', false)->pluck('id');
        $activeUsers = User::withoutGlobalScope('organization')->whereIn('organization_id', $activeOrganizationIds);
        $inactiveUsers = User::withoutGlobalScope('organization')->whereIn('organization_id', $inactiveOrganizationIds);

        return response()->json(['success' => true, 'data' => [
            'organizations_total' => $organizations->count(),
            'organizations_active' => $organizations->where('active', true)->count(),
            'organizations_inactive' => $organizations->where('active', false)->count(),
            'organizations_created_this_month' => $organizations->filter(fn (Organization $organization) => $organization->created_at?->greaterThanOrEqualTo(Carbon::now()->startOfMonth()))->count(),
            'users_total' => User::withoutGlobalScope('organization')->whereNotNull('organization_id')->count(),
            'users_active' => (clone $activeUsers)->count(),
            'users_inactive' => (clone $inactiveUsers)->count(),
            'managers_active' => (clone $activeUsers)->role('gestor')->count(),
            'employees_active' => (clone $activeUsers)->role('funcionario')->count(),
            'organizations' => $organizations->map(fn (Organization $organization) => [
                'id' => $organization->id,
                'name' => $organization->name,
                'active' => $organization->active,
                'users_count' => $organization->users_count,
            ])->values(),
        ]]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'document' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'settings' => ['sometimes', 'array'],
            'manager.name' => ['required', 'string', 'max:255'],
            'manager.email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'manager.password' => ['required', 'string', 'min:8'],
            'manager.cpf' => ['required', 'string', 'size:11'],
        ]);

        $organization = DB::transaction(function () use ($data) {
            $organization = Organization::create([
                ...collect($data)->except('manager')->all(),
                'active' => true,
            ]);
            $manager = User::create([
                'name' => $data['manager']['name'],
                'email' => $data['manager']['email'],
                'password' => Hash::make($data['manager']['password']),
                'organization_id' => $organization->id,
                'must_change_password' => true,
            ]);
            $manager->assignRole('gestor');
            Funcionario::create(['id' => $manager->id, 'cpf' => $data['manager']['cpf'], 'organization_id' => $organization->id]);
            $organization->update(['settings' => ['manager_id' => $manager->id]]);

            return $organization->loadCount('users');
        });

        return response()->json(['success' => true, 'data' => $organization], 201);
    }

    public function update(Request $request, Organization $organization)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'document' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'settings' => ['sometimes', 'array'],
            'active' => ['sometimes', 'boolean'],
            'manager_id' => ['sometimes', 'nullable', 'uuid', 'exists:users,id'],
        ]);
        $managerId = $data['manager_id'] ?? null;
        unset($data['manager_id']);
        if (array_key_exists('manager_id', $request->all())) {
            if ($managerId && ! $organization->users()->role('gestor')->whereKey($managerId)->exists()) {
                return response()->json(['message' => 'O gestor selecionado não pertence a esta organização.'], 422);
            }
            $data['settings'] = [...($organization->settings ?? []), 'manager_id' => $managerId];
        }
        $organization->update($data);

        return response()->json(['success' => true, 'data' => $organization->fresh()->loadCount('users')]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Funcionario;
use App\Models\User;
use App\Models\Categoria;
use App\Models\UnidadeMedida;
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
            ]);
            $manager->assignRole('gestor');
            Funcionario::create(['id' => $manager->id, 'cpf' => $data['manager']['cpf'], 'organization_id' => $organization->id]);
            $organization->update(['settings' => ['manager_id' => $manager->id]]);

            $baseOrganizationId = Organization::query()->where('name', 'Organização padrão')->value('id');
            $categorias = $baseOrganizationId
                ? Categoria::withoutGlobalScope('organization')->where('organization_id', $baseOrganizationId)->pluck('nome')->all()
                : [];
            $unidades = $baseOrganizationId
                ? UnidadeMedida::withoutGlobalScope('organization')->where('organization_id', $baseOrganizationId)->get(['nome', 'sigla'])->toArray()
                : [];
            foreach ($categorias ?: ['Alimentos', 'Bebidas', 'Limpeza', 'Higiene Pessoal', 'Eletrônicos', 'Roupas', 'Calçados', 'Móveis', 'Insumos', 'Papelaria'] as $nome) {
                $copia = new Categoria(['nome' => $nome]);
                $copia->organization_id = $organization->id;
                $copia->save();
            }
            foreach ($unidades ?: [
                ['nome' => 'Unidade', 'sigla' => 'UN'], ['nome' => 'Quilograma', 'sigla' => 'KG'],
                ['nome' => 'Grama', 'sigla' => 'G'], ['nome' => 'Litro', 'sigla' => 'L'],
                ['nome' => 'Mililitro', 'sigla' => 'ML'], ['nome' => 'Metro', 'sigla' => 'M'],
                ['nome' => 'Caixa', 'sigla' => 'CX'], ['nome' => 'Pacote', 'sigla' => 'PKG'],
            ] as $unidade) {
                $copia = new UnidadeMedida(['nome' => $unidade['nome'], 'sigla' => $unidade['sigla']]);
                $copia->organization_id = $organization->id;
                $copia->save();
            }

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

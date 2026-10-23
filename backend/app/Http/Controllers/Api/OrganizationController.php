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

class OrganizationController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => Organization::withCount('users')->latest()->get()]);
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
        ]);
        $organization->update($data);

        return response()->json(['success' => true, 'data' => $organization->fresh()->loadCount('users')]);
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'name'                        => ['sometimes', 'string', 'max:255'],
            'email'                       => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'password'                    => ['sometimes', 'string', 'min:8', 'confirmed'],
            'role'                        => ['sometimes', 'string', 'exists:roles,name', 'not_in:admin'],
            'funcionario.telefone'        => ['sometimes', 'nullable', 'string', 'max:20'],
            'funcionario.data_nascimento' => ['sometimes', 'nullable', 'date'],
            'funcionario.cpf'             => ['sometimes', 'nullable', 'string', 'size:11'],
            'endereco.cep'                => ['sometimes', 'string', 'size:9'],
            'endereco.logradouro'         => ['sometimes', 'string', 'max:255'],
            'endereco.numero'             => ['sometimes', 'string', 'max:20'],
            'endereco.complemento'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'endereco.bairro'             => ['sometimes', 'string', 'max:255'],
            'endereco.cidade'             => ['sometimes', 'string', 'max:255'],
            'endereco.estado'             => ['sometimes', 'string', 'size:2'],
            'permissions'   => ['sometimes', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}

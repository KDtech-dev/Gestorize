<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                        => ['required', 'string', 'max:255'],
            'email'                       => ['required', 'email', 'unique:users,email'],
            'password'                    => ['required', 'string', 'min:8', 'confirmed'],
            'role'                        => ['required', 'string', 'exists:roles,name', 'not_in:admin'],
            'funcionario.telefone'        => ['nullable', 'string', 'max:20'],
            'funcionario.data_nascimento' => ['nullable', 'date'],
            'funcionario.cpf'             => ['nullable', 'string', 'size:11'],
            'endereco.cep'                => ['required', 'string', 'size:9'],
            'endereco.logradouro'         => ['required', 'string', 'max:255'],
            'endereco.numero'             => ['required', 'string', 'max:20'],
            'endereco.complemento'        => ['nullable', 'string', 'max:255'],
            'endereco.bairro'             => ['required', 'string', 'max:255'],
            'endereco.cidade'             => ['required', 'string', 'max:255'],
            'endereco.estado'             => ['required', 'string', 'size:2'],
            'permissions'   => ['sometimes', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}

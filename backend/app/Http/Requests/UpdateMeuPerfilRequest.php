<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMeuPerfilRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId, 'id')],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'funcionario' => ['sometimes', 'array'],
            'funcionario.telefone' => ['nullable', 'string', 'max:20'],
            'funcionario.cpf' => ['nullable', 'string', 'max:14', Rule::unique('funcionarios', 'cpf')->ignore($userId, 'id')],
            'funcionario.data_nascimento' => ['nullable', 'date', 'before_or_equal:today'],
            'endereco' => ['sometimes', 'array'],
            'endereco.cep' => ['nullable', 'string', 'max:9'],
            'endereco.logradouro' => ['nullable', 'string', 'max:255'],
            'endereco.numero' => ['nullable', 'string', 'max:20'],
            'endereco.complemento' => ['nullable', 'string', 'max:100'],
            'endereco.bairro' => ['nullable', 'string', 'max:100'],
            'endereco.cidade' => ['nullable', 'string', 'max:100'],
            'endereco.estado' => ['nullable', 'string', 'size:2'],
        ];
    }
}

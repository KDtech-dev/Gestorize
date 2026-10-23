<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFornecedorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:255',],
            'cnpj' => ['required', 'string', 'max:18', Rule::unique('fornecedores', 'cnpj'),],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('fornecedores', 'email'),],
            'telefone' => ['required', 'string', 'max:20',],
            'ramo_atividade' => ['nullable', 'string', 'max:255',],
            'categoria_ids' => ['sometimes', 'array'],
            'categoria_ids.*' => ['uuid', 'distinct', 'exists:categorias,id'],
            'nome_responsavel' => ['nullable', 'string', 'max:255',],
            'chave_pix' => ['nullable', 'string', 'max:255',],
            'endereco_id' => ['nullable', 'uuid', 'exists:enderecos,id',],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.required' => 'O nome do fornecedor é obrigatório.',
            'cnpj.required' => 'O CNPJ do fornecedor é obrigatório.',
            'cnpj.unique' => 'Este CNPJ já está cadastrado.',
            'email.email' => 'Informe um endereço de e-mail válido.',
            'email.unique' => 'Este e-mail já está cadastrado para outro fornecedor.',
            'telefone.required' => 'O telefone do fornecedor é obrigatório.',
            'endereco_id.uuid' => 'O identificador do endereço deve ser um UUID válido.',
            'endereco_id.exists' => 'O endereço informado não foi encontrado.',
        ];
    }
}

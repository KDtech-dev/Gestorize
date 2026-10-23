<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFornecedorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $fornecedor = $this->route('fornecedor');

        $fornecedorId = is_object($fornecedor) ? $fornecedor->id : $fornecedor;

        return [
            'nome' => ['sometimes', 'required', 'string', 'max:255',],
            'cnpj' => ['sometimes', 'required', 'string', 'max:18', Rule::unique('fornecedores', 'cnpj')->ignore($fornecedorId),],
            'email' => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('fornecedores', 'email')->ignore($fornecedorId),],
            'telefone' => ['sometimes', 'required', 'string', 'max:20',],
            'ramo_atividade' => ['sometimes', 'nullable', 'string', 'max:255',],
            'categoria_ids' => ['sometimes', 'array'],
            'categoria_ids.*' => ['uuid', 'distinct', 'exists:categorias,id'],
            'nome_responsavel' => ['sometimes', 'nullable', 'string', 'max:255',],
            'chave_pix' => ['sometimes', 'nullable', 'string', 'max:255',],
            'endereco_id' => ['sometimes', 'nullable', 'uuid', 'exists:enderecos,id',],
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

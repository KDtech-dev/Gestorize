<?php

namespace App\Http\Requests;

use App\Models\Orcamento;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOrcamentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (!($this->user()?->can('orcamentos.editar') ?? false)) {
            return false;
        }

        return Orcamento::whereKey($this->route('id'))
            ->value('status') !== 'aprovado';
    }

    public function rules(): array
    {
        return [
            'titulo' => ['sometimes', 'required', 'string', 'max:120'],
            'cliente_id' => ['sometimes', 'required', 'uuid', 'exists:clientes,id'],
            'itens' => ['sometimes', 'array', 'min:1'],
            'itens.*.produto_id' => ['required_with:itens', 'uuid', 'distinct', 'exists:produtos,id'],
            'itens.*.quantidade' => ['required_with:itens', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'cliente_id.exists' => 'O cliente selecionado não existe.',
            'titulo.required' => 'O título do orçamento é obrigatório.',
            'titulo.max' => 'O título deve ter no máximo 120 caracteres.',
            'itens.min' => 'Adicione pelo menos um produto ao orçamento.',
            'itens.*.produto_id.exists' => 'Um dos produtos selecionados não existe.',
            'itens.*.produto_id.distinct' => 'Não repita o mesmo produto; ajuste a quantidade do item.',
            'itens.*.quantidade.min' => 'A quantidade de cada produto deve ser pelo menos 1.',
        ];
    }
}

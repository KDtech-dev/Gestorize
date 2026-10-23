<?php

namespace App\Http\Requests;

use App\Rules\BelongsToCurrentOrganization;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrcamentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('orcamentos.criar') ?? false;
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:120'],
            'cliente_id' => ['required', 'uuid', new BelongsToCurrentOrganization('clientes')],
            'itens' => ['required', 'array', 'min:1'],
            'itens.*.produto_id' => ['required_with:itens', 'uuid', 'distinct', new BelongsToCurrentOrganization('produtos')],
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

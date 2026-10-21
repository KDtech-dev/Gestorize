<?php

namespace App\Http\Requests;

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
            'cliente_id' => ['required', 'uuid', 'exists:clientes,id'],
            'data_orcamento' => ['required', 'date'],
            'valor_total' => ['required_without:itens', 'numeric', 'min:0'],
            'itens' => ['sometimes', 'array', 'min:1'],
            'itens.*.produto_id' => ['required_with:itens', 'uuid', 'distinct', 'exists:produtos,id'],
            'itens.*.quantidade' => ['required_with:itens', 'integer', 'min:1'],
            'itens.*.preco_unitario' => ['sometimes', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'cliente_id.exists' => 'O cliente selecionado não existe.',
            'itens.min' => 'Adicione pelo menos um produto ao orçamento.',
            'itens.*.produto_id.exists' => 'Um dos produtos selecionados não existe.',
            'itens.*.produto_id.distinct' => 'Não repita o mesmo produto; ajuste a quantidade do item.',
            'itens.*.quantidade.min' => 'A quantidade de cada produto deve ser pelo menos 1.',
        ];
    }
}

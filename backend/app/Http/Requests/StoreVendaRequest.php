<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVendaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'itens' => ['required', 'array', 'min:1'],
            'itens.*.produto_id' => ['required', 'uuid', 'distinct', 'exists:produtos,id'],
            'itens.*.quantidade' => ['required', 'integer', 'min:1'],
            'cliente_id' => ['nullable', 'uuid', 'exists:clientes,id'],
            'orcamento_id' => ['nullable', 'uuid', 'exists:orcamentos,id'],
            'forma_pagamento' => ['nullable', 'in:pix,dinheiro,debito,credito'],
        ];
    }
}

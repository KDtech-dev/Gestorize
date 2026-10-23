<?php

namespace App\Http\Requests;

use App\Rules\BelongsToCurrentOrganization;

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
            'itens.*.produto_id' => ['required', 'uuid', 'distinct', new BelongsToCurrentOrganization('produtos')],
            'itens.*.quantidade' => ['required', 'integer', 'min:1'],
            'cliente_id' => ['nullable', 'uuid', new BelongsToCurrentOrganization('clientes')],
            'orcamento_id' => ['nullable', 'uuid', new BelongsToCurrentOrganization('orcamentos')],
            'forma_pagamento' => ['nullable', 'in:pix,dinheiro,debito,credito'],
            'desconto' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EstornarVendaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->can('vendas.criar')
            || $user->hasAnyRole(['admin', 'gestor', 'funcionario'])
        );
    }

    public function rules(): array
    {
        return [
            'codigo_autorizador' => ['required', 'string', 'alpha_num', 'size:12'],
            'senha_autorizador' => ['required', 'string', 'max:255'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AprovarOrcamentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $usuario = $this->user();

        return $usuario !== null && (
            $usuario->can('orcamentos.criar')
            || $usuario->can('orcamentos.editar')
            || $usuario->can('orcamentos.aprovar')
        );
    }

    public function rules(): array
    {
        return [];
    }
}

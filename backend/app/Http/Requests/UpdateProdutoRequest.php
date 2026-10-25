<?php

namespace App\Http\Requests;

use App\Rules\BelongsToCurrentOrganization;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use App\Models\Categoria;
use App\Models\Produto;
use App\Rules\UniqueProductBarcode;

class UpdateProdutoRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_array($this->input('codigos_barras'))) {
            $this->merge(['codigos_barras' => array_map(fn ($codigo) => is_string($codigo) ? trim($codigo) : $codigo, $this->input('codigos_barras'))]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['sometimes', 'required', 'string', 'max:255',],
            'descricao' => ['sometimes', 'nullable', 'string',],
            'preco_custo' => ['sometimes', 'required', 'numeric', 'min:0',],
            'porcentagem_lucro' => ['sometimes', 'required', 'numeric', 'min:0',],
            'preco_venda' => ['sometimes', 'required', 'numeric', 'min:0',],
            'data_entrada' => ['sometimes', 'required', 'date',],
            'categoria_id' => ['sometimes', 'nullable', 'uuid', new BelongsToCurrentOrganization('categorias')],
            'fornecedor_id' => ['sometimes', 'nullable', 'uuid', new BelongsToCurrentOrganization('fornecedores')],
            'unidade_medida_id' => ['sometimes', 'required', 'uuid', new BelongsToCurrentOrganization('unidades_medida')],
            'estoque' => ['sometimes', 'required', 'numeric', 'min:0',],
            'validade' => ['sometimes', 'nullable', 'date', 'after_or_equal:data_entrada', 'after_or_equal:today'],
            'codigos_barras' => ['sometimes', 'array', 'max:20'],
            'codigos_barras.*' => ['required', 'string', 'max:64', 'distinct', new UniqueProductBarcode((string) ($this->route('produto')?->id ?? $this->route('produto')))],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $produto = $this->route('produto');
            $produto = $produto instanceof Produto ? $produto : Produto::find($produto);
            $categoriaId = $this->input('categoria_id', $produto?->categoria_id);
            $validade = $this->input('validade', $produto?->validade);
            $nome = $categoriaId ? Categoria::whereKey($categoriaId)->value('nome') : null;
            if (in_array(mb_strtolower((string) $nome), ['insumos', 'produtos médicos/hospitalares'], true)
                && !$validade) {
                $validator->errors()->add('validade', 'A validade é obrigatória para esta categoria.');
            }
            $entradaAtual = $produto?->data_entrada;
            $entrada = $this->input('data_entrada', $entradaAtual ? substr((string) $entradaAtual, 0, 10) : null);
            if ($validade && $entrada && $validade < $entrada) {
                $validator->errors()->add('validade', 'A validade não pode ser anterior à data de entrada.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'nome.required' => 'O nome do produto é obrigatório.',
            'nome.max' => 'O nome do produto deve ter no máximo 255 caracteres.',

            'descricao.string' => 'A descrição deve ser um texto.',

            'preco_custo.required' => 'O preço de custo é obrigatório.',
            'preco_custo.numeric' => 'O preço de custo deve ser numérico.',
            'preco_custo.min' => 'O preço de custo não pode ser negativo.',

            'porcentagem_lucro.required' => 'A porcentagem de lucro é obrigatória.',
            'porcentagem_lucro.numeric' => 'A porcentagem de lucro deve ser numérica.',
            'porcentagem_lucro.min' => 'A porcentagem de lucro não pode ser negativa.',

            'preco_venda.required' => 'O preço de venda é obrigatório.',
            'preco_venda.numeric' => 'O preço de venda deve ser numérico.',
            'preco_venda.min' => 'O preço de venda não pode ser negativo.',

            'data_entrada.required' => 'A data de entrada é obrigatória.',
            'data_entrada.date' => 'A data de entrada deve ser uma data válida.',

            'categoria_id.required' => 'A categoria é obrigatória.',
            'categoria_id.uuid' => 'A categoria deve ser um UUID válido.',
            'categoria_id.exists' => 'A categoria selecionada não existe.',

            'fornecedor_id.required' => 'O fornecedor é obrigatório.',
            'fornecedor_id.uuid' => 'O fornecedor deve ser um UUID válido.',
            'fornecedor_id.exists' => 'O fornecedor selecionado não existe.',

            'unidade_medida_id.required' => 'A unidade de medida é obrigatória.',
            'unidade_medida_id.uuid' => 'A unidade de medida deve ser um UUID válido.',
            'unidade_medida_id.exists' => 'A unidade de medida selecionada não existe.',

            'estoque.required' => 'O estoque é obrigatório.',
            'estoque.numeric' => 'O estoque deve ser numérico.',
            'estoque.min' => 'O estoque não pode ser negativo.',

            'validade.date' => 'A validade deve ser uma data válida.',
            'validade.after_or_equal' => 'A validade não pode ser anterior à data de entrada nem estar vencida.',
        ];
    }
}

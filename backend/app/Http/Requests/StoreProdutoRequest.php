<?php

namespace App\Http\Requests;

use App\Rules\BelongsToCurrentOrganization;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use App\Models\Categoria;

class StoreProdutoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:255',],
            'descricao' => ['nullable', 'string',],
            'preco_custo' => ['required', 'numeric', 'min:0',],
            'porcentagem_lucro' => ['required', 'numeric', 'min:0',],
            'preco_venda' => ['required', 'numeric', 'min:0',],
            'data_entrada' => ['required',  'date',],
            'categoria_id' => ['nullable', 'uuid', new BelongsToCurrentOrganization('categorias')],
            'fornecedor_id' => ['nullable', 'uuid', new BelongsToCurrentOrganization('fornecedores')],
            'unidade_medida_id' => ['required', 'uuid', new BelongsToCurrentOrganization('unidades_medida')],
            'estoque' => ['required', 'numeric', 'min:0',],
            'validade' => ['nullable', 'date', 'after_or_equal:data_entrada', 'after_or_equal:today'],
            'imagens' => ['sometimes', 'array', 'max:10'],
            'imagens.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:10240'],
            'imagem_principal' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $imagens = $this->file('imagens', []);
            $principal = $this->input('imagem_principal');
            if ($principal !== null && (!count($imagens) || (int) $principal >= count($imagens))) {
                $validator->errors()->add('imagem_principal', 'Selecione uma imagem principal válida.');
            }

            $categoriaId = $this->input('categoria_id');
            if (!$categoriaId) return;
            $nome = Categoria::whereKey($categoriaId)->value('nome');
            if (in_array(mb_strtolower((string) $nome), ['insumos', 'produtos médicos/hospitalares'], true)
                && !$this->filled('validade')) {
                $validator->errors()->add('validade', 'A validade é obrigatória para esta categoria.');
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

            'categoria_id.uuid' => 'A categoria deve ser um UUID válido.',
            'categoria_id.exists' => 'A categoria selecionada não existe.',

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
            'imagens.array' => 'As imagens do produto são inválidas.',
            'imagens.max' => 'Adicione no máximo 10 imagens ao produto.',
            'imagens.*.image' => 'Todos os arquivos devem ser imagens.',
            'imagens.*.mimes' => 'As imagens devem estar no formato JPG, PNG ou WEBP.',
            'imagens.*.max' => 'Cada imagem pode ter até 10 MB.',
        ];
    }
}

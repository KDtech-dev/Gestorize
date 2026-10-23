<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Override;

class StoreClienteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('clientes.criar') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $data = $this->all();

        if (isset($data['telefone'])) {
            $data['telefone'] = preg_replace('/\D/', '', $data['telefone']);
        }

        if (isset($data['endereco']['cep'])) {
            $data['endereco']['cep'] = preg_replace('/\D/', '', $data['endereco']['cep']);
        }

        if (isset($data['pf']['cpf'])) {
            $data['pf']['cpf'] = preg_replace('/\D/', '', $data['pf']['cpf']);
        }

        if (isset($data['pf']['rg'])) {
            $data['pf']['rg'] = preg_replace('/\D/', '', $data['pf']['rg']);
        }

        if (isset($data['pf']['data_nascimento'])) {
            $data['pf']['data_nascimento'] = $this->formatDate(
                $data['pf']['data_nascimento']
            );
        }

        if (isset($data['pj']['cnpj'])) {
            $data['pj']['cnpj'] = preg_replace('/\D/', '', $data['pj']['cnpj']);
        }

        if (isset($data['pj']['cpf_responsavel'])) {
            $data['pj']['cpf_responsavel'] = preg_replace(
                '/\D/',
                '',
                $data['pj']['cpf_responsavel']
            );
        }

        $this->replace($data);
    }

    private function formatDate(?string $date): ?string
    {
        if (empty($date)) {
            return null;
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $date;
        }

        if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $date, $matches)) {
            return $matches[3] . '-' . $matches[2] . '-' . $matches[1];
        }

        if (preg_match('/^(\d{2})-(\d{2})-(\d{4})$/', $date, $matches)) {
            return $matches[3] . '-' . $matches[2] . '-' . $matches[1];
        }

        return $date;
    }

    public function rules(): array
    {
        return [

            'nome' => ['required', 'string', 'max:255',],
            'tipo' => ['required', 'string', Rule::in(['pf', 'pj']),],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('clientes', 'email')->where('organization_id', $this->user()?->organization_id),],
            'telefone' => ['nullable', 'string', 'max:20',],

            'avatar' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048',],

            'endereco' => ['nullable', 'array'],
            'endereco.cep' => ['sometimes', 'nullable', 'string', 'size:8',],
            'endereco.logradouro' => ['sometimes', 'nullable', 'string', 'max:255',],
            'endereco.numero' => ['sometimes', 'nullable', 'string', 'max:20',],
            'endereco.complemento' => ['sometimes', 'nullable', 'string', 'max:100',],
            'endereco.bairro' => ['sometimes', 'nullable', 'string', 'max:100',],
            'endereco.cidade' => ['sometimes', 'nullable', 'string', 'max:100',],
            'endereco.estado' => ['sometimes', 'nullable', 'string', 'size:2',],

            'pf' => ['required_if:tipo,pf', 'array',],
            'pf.genero' => ['nullable', 'string', Rule::in(['masculino', 'feminino', 'outro',]),],
            'pf.rg' => ['required_if:tipo,pf', 'string', 'max:20',],
            'pf.cpf' => ['required_if:tipo,pf', 'string', 'size:11', Rule::unique('clientes_pf', 'cpf')->where('organization_id', $this->user()?->organization_id),],
            'pf.data_nascimento' => ['required_if:tipo,pf', 'date', 'before:today',],

            'pj' => ['required_if:tipo,pj', 'array',],
            'pj.cnpj' => ['required_if:tipo,pj', 'string', 'size:14', Rule::unique('clientes_pj', 'cnpj')->where('organization_id', $this->user()?->organization_id),],
            'pj.razao_social' => ['required_if:tipo,pj', 'string', 'max:255',],
            'pj.nome_fantasia' => ['nullable', 'string', 'max:255',],
            'pj.nome_responsavel' => ['required_if:tipo,pj', 'string', 'max:255',],
            'pj.cpf_responsavel' => ['required_if:tipo,pj', 'string', 'size:11',],
            'pj.cargo_responsavel' => ['nullable', 'string', 'max:100',],
        ];
    }

    public function messages(): array
    {
        return [
            'tipo.in' => 'validation.cliente_tipo.in',
            'pf.required_if' => 'validation.cliente_pf.required_if',
            'pf.cpf.required_if' => 'validation.cpf.required_if',
            'pf.cpf.size' => 'validation.cpf.size',
            'pf.cpf.unique' => 'validation.cpf.unique',
            'pf.data_nascimento.before' => 'validation.data_nascimento.before',
            'pj.required_if' => 'validation.cliente_pj.required_if',
            'pj.cnpj.required_if' => 'validation.cnpj.required_if',
            'pj.cnpj.size' => 'validation.cnpj.size',
            'pj.cnpj.unique' => 'validation.cnpj.unique',
            'pj.cpf_responsavel.size' => 'validation.cpf_responsavel.size',
            'endereco.cep.size' => 'validation.cep.size',
            'endereco.estado.size' => 'validation.uf.size',
        ];
    }
}

<?php

namespace App\Http\Requests;

use App\Models\Cliente;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Override;

class UpdateClienteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('clientes.editar') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $data = $this->all();

        if (isset($data['cpf'])) {
            $data['cpf'] = preg_replace('/\D/', '', $data['cpf']);
        }

        if (isset($data['pf']['cpf'])) {
            $data['pf']['cpf'] = preg_replace('/\D/', '', $data['pf']['cpf']);
        }
        if (isset($data['pf']['rg'])) {
            $data['pf']['rg'] = strtoupper(preg_replace('/[^0-9x]/i', '', $data['pf']['rg']));
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

        if (isset($data['endereco']['cep'])) {
            $data['endereco']['cep'] = preg_replace(
                '/\D/',
                '',
                $data['endereco']['cep']
            );
        }

        if (isset($data['telefone'])) {
            $data['telefone'] = preg_replace(
                '/\D/',
                '',
                $data['telefone']
            );
        }

        if (isset($data['pf']['data_nascimento'])) {
            $data['pf']['data_nascimento'] = $this->formatDate(
                $data['pf']['data_nascimento']
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
        $cliente = Cliente::with(['dadosPf', 'dadosPj'])->find($this->route('id'));
        $pfId = $cliente?->dadosPf?->id;
        $pjId = $cliente?->dadosPj?->id;


        return [


            'nome' => ['sometimes', 'string', 'max:255',],
            'tipo' => ['sometimes', 'string', 'in:pf,pj',],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('clientes', 'email')->where('organization_id', $this->user()?->organization_id)->ignore($this->route('id'))
            ],
            'telefone' => ['sometimes', 'nullable', 'string', 'max:20',],
            'imagem' => ['sometimes', 'nullable', 'string', 'max:500',],

            'endereco' => ['sometimes', 'nullable', 'array',],
            'endereco.cep' => ['sometimes', 'string', 'size:8',],
            'endereco.logradouro' => ['sometimes', 'string', 'max:255',],
            'endereco.numero' => ['sometimes', 'string', 'max:20',],
            'endereco.complemento' => ['sometimes', 'nullable', 'string', 'max:100',],
            'endereco.bairro' => ['sometimes', 'string', 'max:100',],
            'endereco.cidade' => ['sometimes', 'string', 'max:100',],
            'endereco.estado' => ['sometimes', 'string', 'size:2',],

            'pf' => ['sometimes', 'array',],
            'pf.genero' => ['nullable', 'string', Rule::in(['masculino', 'feminino', 'outro',]),],
            'pf.rg' => ['sometimes', 'string', 'min:5', 'max:14', 'regex:/^\d{4,13}[0-9X]$/',],
            'pf.cpf' => [
                'sometimes',
                'string',
                'size:11',
                Rule::unique('clientes_pf', 'cpf')->where('organization_id', $this->user()?->organization_id)->ignore($pfId, 'id'),
            ],
            'pf.data_nascimento' => ['sometimes', 'nullable', 'date', 'before:today',],

            'pj' => ['sometimes', 'array',],
            'pj.cnpj' => [
                'sometimes',
                'string',
                'size:14',
                Rule::unique('clientes_pj', 'cnpj')->where('organization_id', $this->user()?->organization_id)->ignore($pjId, 'id'),
            ],
            'pj.razao_social' => ['sometimes', 'string', 'max:255',],
            'pj.nome_fantasia' => ['sometimes', 'nullable', 'string', 'max:255',],
            'pj.nome_responsavel' => ['sometimes', 'nullable', 'string', 'max:255',],
            'pj.cpf_responsavel' => ['sometimes', 'nullable', 'string', 'size:11',],
            'pj.cargo_responsavel' => ['sometimes', 'nullable', 'string', 'max:100',],
        ];
    }

    public function messages(): array
    {
        return [
            'tipo.in' => 'validation.tipo.in',
            'pf.genero.in' => 'validation.genero.in',
            'pf.cpf.size' => 'validation.cpf.size',
            'pf.cpf.unique' => 'validation.cpf.unique',
            'pf.data_nascimento.date' => 'validation.data_nascimento.date',
            'pf.data_nascimento.before' => 'validation.data_nascimento.before',
            'pj.cnpj.size' => 'validation.cnpj.size',
            'pj.cnpj.unique' => 'validation.cnpj.unique',
            'endereco.cep.size' => 'validation.cep.size',
            'endereco.estado.size' => 'validation.estado.size',
        ];
    }
}

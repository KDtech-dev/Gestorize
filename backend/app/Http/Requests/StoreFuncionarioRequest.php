<?php

namespace App\Http\Requests;

use App\Enums\PermissionEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Rules\BelongsToCurrentOrganization;

class StoreFuncionarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return ! $this->exists('permissions') || $this->user()?->can('acessos.gerenciar') === true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('cpf')) {
            $this->merge([
                'cpf' => preg_replace('/\D/', '', $this->cpf),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255',],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email'),],
            'password' => ['required', 'string', 'min:8', 'confirmed',],
            'telefone' => ['nullable', 'string', 'max:20',],
            'data_nascimento' => ['required', 'date', 'before:today',],
            'cpf' => ['required', 'string', 'size:11', Rule::unique('funcionarios', 'cpf')->where('organization_id', $this->user()?->organization_id),],
            'endereco_id' => ['nullable', 'uuid', new BelongsToCurrentOrganization('enderecos')],
            'role' => ['required', 'string', Rule::in(['gestor', 'funcionario',]),],
            'permissions' => ['sometimes', 'array',],
            'permissions.*' => ['required', 'string', 'distinct', Rule::in(PermissionEnum::values()),],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'O nome do funcionário é obrigatório.',

            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'Informe um e-mail válido.',
            'email.unique' => 'Este e-mail já está cadastrado.',

            'password.required' => 'A senha é obrigatória.',
            'password.min' => 'A senha deve possuir pelo menos 8 caracteres.',
            'password.confirmed' => 'A confirmação da senha não corresponde.',

            'data_nascimento.required' => 'A data de nascimento é obrigatória.',
            'data_nascimento.date' => 'Informe uma data de nascimento válida.',
            'data_nascimento.before' => 'A data de nascimento deve ser anterior à data atual.',

            'cpf.required' => 'O CPF é obrigatório.',
            'cpf.size' => 'O CPF deve conter 11 dígitos.',
            'cpf.unique' => 'Este CPF já está cadastrado.',

            'endereco_id.uuid' => 'O identificador do endereço é inválido.',
            'endereco_id.exists' => 'O endereço informado não foi encontrado.',

            'role.required' => 'O perfil do usuário é obrigatório.',
            'role.in' => 'O perfil informado não é permitido.',

            'permissions.array' => 'As permissões devem ser enviadas em uma lista.',
            'permissions.*.distinct' => 'Não é permitido informar permissões duplicadas.',
            'permissions.*.in' => 'Uma ou mais permissões informadas são inválidas.',
        ];
    }
}

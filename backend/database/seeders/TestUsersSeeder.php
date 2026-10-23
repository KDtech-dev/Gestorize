<?php

namespace Database\Seeders;

use App\Enums\RoleEnum;
use App\Models\Endereco;
use App\Models\User;
use App\Models\Funcionario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        $admin = $this->criarUsuario(
            nome: 'Administrador Teste',
            email: 'teste@email.com',
            role: RoleEnum::ADMIN,
            telefone: '(11) 91111-0001',
            cpf: '111.111.111-11',
            dataNascimento: '1985-01-10',
            endereco: [
                'cep' => '01310-100',
                'logradouro' => 'Av. Paulista',
                'numero' => '1000',
                'bairro' => 'Bela Vista',
                'cidade' => 'São Paulo',
                'estado' => 'SP',
            ],
        );

        $gestor = $this->criarUsuario(
            nome: 'Gestor Teste',
            email: 'gestor@example.com',
            role: RoleEnum::GESTOR,
            telefone: '(21) 92222-0002',
            cpf: '222.222.222-22',
            dataNascimento: '1990-06-15',
            endereco: [
                'cep' => '20040-020',
                'logradouro' => 'Av. Rio Branco',
                'numero' => '200',
                'bairro' => 'Centro',
                'cidade' => 'Rio de Janeiro',
                'estado' => 'RJ',
            ],
        );

        $funcionario = $this->criarUsuario(
            nome: 'Funcionário Teste',
            email: 'funcionario@example.com',
            role: RoleEnum::FUNCIONARIO,
            telefone: '(31) 93333-0003',
            cpf: '333.333.333-33',
            dataNascimento: '1995-03-20',
            endereco: [
                'cep' => '30130-110',
                'logradouro' => 'Av. Afonso Pena',
                'numero' => '300',
                'bairro' => 'Centro',
                'cidade' => 'Belo Horizonte',
                'estado' => 'MG',
            ],
        );

        foreach (range(1, 4) as $indice) {
            $this->criarUsuario(
                nome: "Operador de Demonstração {$indice}",
                email: "operador{$indice}@example.com",
                role: RoleEnum::FUNCIONARIO,
                telefone: sprintf('(11) 94444-%04d', $indice),
                cpf: sprintf('444.444.444-%02d', $indice),
                dataNascimento: sprintf('199%d-0%d-15', $indice % 10, $indice + 1),
                endereco: [
                    'cep' => sprintf('0100%d-000', $indice),
                    'logradouro' => 'Rua de Demonstração',
                    'numero' => (string) (100 + $indice),
                    'bairro' => 'Centro',
                    'cidade' => 'São Paulo',
                    'estado' => 'SP',
                ],
            );
        }
    }

    private function criarUsuario(
        string $nome,
        string $email,
        RoleEnum $role,
        string $telefone,
        string $cpf,
        string $dataNascimento,
        array $endereco,
    ): User {
        $user = User::updateOrCreate(['email' => $email], [
            'name' => $nome,
            'password' => Hash::make('123456'),
        ]);

        $user->syncRoles([$role->value]);
        $user->update(['organization_id' => $role === RoleEnum::ADMIN
            ? null
            : ($user->organization_id ?? \App\Models\Organization::query()->value('id'))]);

        $registroFuncionario = Funcionario::query()->whereKey($user->id)->first();
        $registroEndereco = $registroFuncionario?->endereco;
        if ($registroEndereco) {
            $registroEndereco->update($endereco);
        } else {
            $registroEndereco = Endereco::create($endereco);
        }

        Funcionario::updateOrCreate(['id' => $user->id], [
            'telefone' => $telefone,
            'cpf' => $cpf,
            'data_nascimento' => $dataNascimento,
            'endereco_id' => $registroEndereco->id,
        ]);

        return $user;
    }
}

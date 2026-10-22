<?php

namespace App\Enums;

enum PermissionEnum: string
{
    case CLIENTES_VER = 'clientes.ver';
    case CLIENTES_CRIAR = 'clientes.criar';
    case CLIENTES_EDITAR = 'clientes.editar';
    case CLIENTES_EXCLUIR = 'clientes.excluir';

    case PRODUTOS_VER = 'produtos.ver';
    case PRODUTOS_CRIAR = 'produtos.criar';
    case PRODUTOS_EDITAR = 'produtos.editar';
    case PRODUTOS_EXCLUIR = 'produtos.excluir';

    case FORNECEDORES_VER = 'fornecedores.ver';
    case FORNECEDORES_CRIAR = 'fornecedores.criar';
    case FORNECEDORES_EDITAR = 'fornecedores.editar';
    case FORNECEDORES_EXCLUIR = 'fornecedores.excluir';

    case ORCAMENTOS_VER = 'orcamentos.ver';
    case ORCAMENTOS_CRIAR = 'orcamentos.criar';
    case ORCAMENTOS_EDITAR = 'orcamentos.editar';
    case ORCAMENTOS_EXCLUIR = 'orcamentos.excluir';
    case ORCAMENTOS_APROVAR = 'orcamentos.aprovar';

    case VENDAS_VER = 'vendas.ver';
    case VENDAS_CRIAR = 'vendas.criar';

    case USERS_VER = 'users.ver';
    case USERS_CRIAR = 'users.criar';
    case USERS_EDITAR = 'users.editar';
    case USERS_EXCLUIR = 'users.excluir';

    case RELATORIOS_VER = 'relatorios.ver';
    case RELATORIOS_GERAR = 'relatorios.gerar';
    case RELATORIOS_EXPORTAR = 'relatorios.exportar';

    case ACESSOS_GERENCIAR = 'acessos.gerenciar';

    public function nome(): string
    {
        return match ($this) {
            self::CLIENTES_VER => 'Visualizar clientes',
            self::CLIENTES_CRIAR => 'Cadastrar clientes',
            self::CLIENTES_EDITAR => 'Editar clientes',
            self::CLIENTES_EXCLUIR => 'Excluir clientes',

            self::PRODUTOS_VER => 'Visualizar produtos',
            self::PRODUTOS_CRIAR => 'Cadastrar produtos',
            self::PRODUTOS_EDITAR => 'Editar produtos',
            self::PRODUTOS_EXCLUIR => 'Excluir produtos',

            self::FORNECEDORES_VER => 'Visualizar fornecedores',
            self::FORNECEDORES_CRIAR => 'Cadastrar fornecedores',
            self::FORNECEDORES_EDITAR => 'Editar fornecedores',
            self::FORNECEDORES_EXCLUIR => 'Excluir fornecedores',

            self::ORCAMENTOS_VER => 'Visualizar orçamentos',
            self::ORCAMENTOS_CRIAR => 'Cadastrar orçamentos',
            self::ORCAMENTOS_EDITAR => 'Editar orçamentos',
            self::ORCAMENTOS_EXCLUIR => 'Excluir orçamentos',
            self::ORCAMENTOS_APROVAR => 'Aprovar orçamentos',

            self::VENDAS_VER => 'Visualizar vendas',
            self::VENDAS_CRIAR => 'Registrar vendas',

            self::USERS_VER => 'Visualizar usuários',
            self::USERS_CRIAR => 'Cadastrar usuários',
            self::USERS_EDITAR => 'Editar usuários',
            self::USERS_EXCLUIR => 'Excluir usuários',

            self::RELATORIOS_VER => 'Visualizar relatórios',
            self::RELATORIOS_GERAR => 'Gerar relatórios',
            self::RELATORIOS_EXPORTAR => 'Exportar relatórios',

            self::ACESSOS_GERENCIAR => 'Gerenciar acessos',
        };
    }

    public function grupo(): string
    {
        return match ($this) {
            self::CLIENTES_VER,
            self::CLIENTES_CRIAR,
            self::CLIENTES_EDITAR,
            self::CLIENTES_EXCLUIR => 'Clientes',

            self::PRODUTOS_VER,
            self::PRODUTOS_CRIAR,
            self::PRODUTOS_EDITAR,
            self::PRODUTOS_EXCLUIR => 'Produtos',

            self::FORNECEDORES_VER,
            self::FORNECEDORES_CRIAR,
            self::FORNECEDORES_EDITAR,
            self::FORNECEDORES_EXCLUIR => 'Fornecedores',

            self::ORCAMENTOS_VER,
            self::ORCAMENTOS_CRIAR,
            self::ORCAMENTOS_EDITAR,
            self::ORCAMENTOS_EXCLUIR,
            self::ORCAMENTOS_APROVAR => 'Orçamentos',

            self::VENDAS_VER,
            self::VENDAS_CRIAR => 'Vendas',

            self::USERS_VER,
            self::USERS_CRIAR,
            self::USERS_EDITAR,
            self::USERS_EXCLUIR => 'Usuários',

            self::RELATORIOS_VER,
            self::RELATORIOS_GERAR,
            self::RELATORIOS_EXPORTAR => 'Relatórios',

            self::ACESSOS_GERENCIAR => 'Acessos',
        };
    }

    public function acao(): string
    {
        return match ($this) {
            self::CLIENTES_VER,
            self::PRODUTOS_VER,
            self::FORNECEDORES_VER,
            self::ORCAMENTOS_VER,
            self::USERS_VER,
            self::RELATORIOS_VER => 'Visualizar',
            self::VENDAS_VER => 'Visualizar',

            self::CLIENTES_CRIAR,
            self::PRODUTOS_CRIAR,
            self::FORNECEDORES_CRIAR,
            self::ORCAMENTOS_CRIAR,
            self::USERS_CRIAR => 'Cadastrar',

            self::CLIENTES_EDITAR,
            self::PRODUTOS_EDITAR,
            self::FORNECEDORES_EDITAR,
            self::ORCAMENTOS_EDITAR,
            self::USERS_EDITAR => 'Editar',

            self::CLIENTES_EXCLUIR,
            self::PRODUTOS_EXCLUIR,
            self::FORNECEDORES_EXCLUIR,
            self::ORCAMENTOS_EXCLUIR,
            self::USERS_EXCLUIR => 'Excluir',

            self::ORCAMENTOS_APROVAR => 'Aprovar',

            self::RELATORIOS_GERAR => 'Gerar',
            self::VENDAS_CRIAR => 'Cadastrar',
            self::RELATORIOS_EXPORTAR => 'Exportar',

            self::ACESSOS_GERENCIAR => 'Gerenciar',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function toArray(): array
    {
        return array_map(
            fn(self $permissao) => [
                'id' => $permissao->value,
                'nome' => $permissao->nome(),
                'grupo' => $permissao->grupo(),
                'acao' => $permissao->acao(),
            ],
            self::cases()
        );
    }
}

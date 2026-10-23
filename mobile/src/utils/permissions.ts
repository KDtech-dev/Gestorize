import type { RootStackParamList, UserType } from '@context/types';

export const can = (user: UserType | null, permission: string): boolean => {
  if (!user) return false;
  // Global admins use explicit global routes; tenant actions follow the same
  // permission list enforced by the API middleware.
  return !!user.permissions?.includes(permission);
};

export const canSell = (user: UserType | null): boolean => !!user && (
  !!user.organization_id && (
  ['admin', 'gestor', 'funcionario'].includes(user.role)
  || !!user.permissions?.includes('vendas.criar')
  )
);

const routePermission: Partial<Record<keyof RootStackParamList, string>> = {
  Clientes: 'clientes.ver',
  Produtos: 'produtos.ver',
  Fornecedores: 'fornecedores.ver',
  Orcamentos: 'orcamentos.ver',
  Funcionarios: 'users.ver',
  NovoCliente: 'clientes.ver',
  NovoProduto: 'produtos.ver',
  NovoFornecedor: 'fornecedores.ver',
  NovoOrcamento: 'orcamentos.ver',
  NovoFuncionario: 'users.ver',
  Relatorios: 'relatorios.ver',
};

export const canAccessRoute = (
  user: UserType | null,
  routeName: keyof RootStackParamList,
) => {
  if (user?.role === 'admin' && !user.organization_id) {
    return routeName === 'Organizacoes' || routeName === 'OrganizacaoForm' || routeName === 'AdministracaoGlobal' || ['Configuracoes', 'Ajuda', 'UserPerfil', 'Homepage'].includes(routeName);
  }
  if (routeName === 'Organizacoes' || routeName === 'OrganizacaoForm' || routeName === 'AdministracaoGlobal') return false;
  if (routeName === 'NovaVenda') return canSell(user);
  if (routeName === 'Vendas') return can(user, 'vendas.ver');
  const required = routePermission[routeName];
  if (required) return can(user, required);
  return ['Configuracoes', 'Ajuda', 'UserPerfil', 'Homepage'].includes(routeName);
};

export const canAccessForm = (
  user: UserType | null,
  resource: 'clientes' | 'produtos' | 'fornecedores' | 'orcamentos' | 'users',
) => can(user, `${resource}.ver`)
  || can(user, `${resource}.criar`)
  || can(user, `${resource}.editar`);

import type { RootStackParamList, UserType } from '@context/types';

export const can = (user: UserType | null, permission: string): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;

  return !!user.permissions?.includes(permission);
};

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
  Vendas: 'vendas.ver',
};

export const canAccessRoute = (
  user: UserType | null,
  routeName: keyof RootStackParamList,
) => {
  const required = routePermission[routeName];
  return required ? can(user, required) : true;
};

export const canAccessForm = (
  user: UserType | null,
  resource: 'clientes' | 'produtos' | 'fornecedores' | 'orcamentos' | 'users',
) => can(user, `${resource}.ver`)
  || can(user, `${resource}.criar`)
  || can(user, `${resource}.editar`);


export type Avatar = {
  name: string;
  image: string | null;
  size: number;
  onPress: () => void;
}

export type Opcao = {
  id?: string;
  nome?: string;


};
export type ErrorResponseType = {
  success?: boolean;
  message?: string;
  code?: number;
  errors?: Record<string, string[]>;
};

export type MessageConversionObject = {
  defaultMessage: string;
  [key: string]: string;
};

export type ResponseType<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ArrayResponseType<T> = {
  success: boolean;
  message: string;
  data: T[];
  meta?: ResponseMetaType;
  total?: number;
};

export type MetaType = {
  perPage: number;
  currentPage: number;
  lastPage: number;
  total: number;
};

export type ResponseMetaType = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type UserType = {
  id: string;
  nome: string;
  email: string;
  role: string;
  permissions?: string[];
};

export type StringfiedDate = string;

export type ClienteType = {
  id: string;
  nome: string;
  tipo: "pf" | "pj";
  email: string | null;
  telefone: string | null;
  avatar_url: string | null;
  endereco: EnderecoType | null;
  pf: PessoaFisicaType | null;
  pj: PessoaJuridicaType | null;
};

export type PessoaFisicaType = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  genero: string;
  estado_civil: string;
  data_nascimento: string;
  rg: string;
  cpf: string;
  endereco_id: string;
};

export type PessoaJuridicaType = {
  id: string;
  razao_social: string;
  email: string;
  nome_fantasia: string;
  cnpj: string;
  nome_responsavel: string;
  cpf_responsavel: string;
  cargo_responsavel: string;
  endereco_id: string;
  telefone: string;
};

export type Genero = "masculino" | "feminino" | "outro";

export type FornecedorType = {
  id: string;
  nome: string;
  cnpj: string;
  ramo_atividade: string;
  telefone: string;
  email: string;
  endereco: EnderecoType | null;
  avatar_url: string;
  nome_responsavel: string;
  chave_pix: string;
  data_criacao: StringfiedDate;
  ultima_atualizacao: StringfiedDate;
};

export type CategoriaType = {
  id: number;
  nome: string;
};

export type UnidadeMedidaType = {
  id: string;
  nome: string;
  sigla: string;
  created_at: string;
  updated_at: string;
};

export type ProdutoImagemType = {
  id: string;
  url: string;
  principal: boolean;
  created_at: StringfiedDate;
  updated_at: StringfiedDate;
};

export type ProdutoType = {
  id: string;
  nome: string;
  descricao: string | null;
  preco_custo: number | null;
  porcentagem_lucro: number | null;
  preco_venda: number | null;
  estoque: number;
  data_entrada: StringfiedDate | null;
  validade: StringfiedDate | null;
  categoria_id: string;
  categoria_titulo: string | null;
  fornecedor_id: string;
  fornecedor_razao_social: string | null;
  unidade_medida_id: string;
  unidade_medida_titulo: string | null;
  unidade_medida_sigla: string | null;
  imagem_principal: ProdutoImagemType | null;
  imagens: ProdutoImagemType[];
  created_at: StringfiedDate;
  updated_at: StringfiedDate;
};

export type OrcamentoItemType = {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto?: ProdutoType | null;
};

export type OrcamentoType = {
  id: string;
  cliente_id: string;
  valor_total: number | string;
  data_orcamento: StringfiedDate;
  cliente?: ClienteType | null;
  itens?: OrcamentoItemType[];
  created_at?: StringfiedDate;
  updated_at?: StringfiedDate;
};

export type RoleName = "admin" | "gestor" | "funcionario" | "cliente";

export type RoleType = {
  id: string;
  name: RoleName;
  label: string;
  permissions: string[];
};

export type PermissaoType = {
  id: string;
  nome: string;
  grupo: string;
  acao: string;
};

export type AcessoType = {
  permissions: string[];
};

export type FuncionarioType = {
  id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  telefone: string | null;
  cpf: string | null;
  data_nascimento: StringfiedDate | null;
  avatar_url: string | null;
  permissions: string[];
  role_permissions: string[];
  endereco: EnderecoType | null;
  created_at: StringfiedDate;
  updated_at: StringfiedDate;
};

export type EnderecoType = {
  id: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
};

export type RootStackParamList = {
  Relatorios: undefined;
  Configuracoes: undefined;
  Ajuda: undefined;
  Login: undefined;
  ResetPassword: undefined;
  ForgoutPassword: undefined;
  Homepage: undefined;
  Orcamentos: undefined;
  NovoOrcamento: { modo: "criar" | "editar"; orcamentoId?: string } | undefined;
  Funcionarios: { novoFuncionario: boolean } | undefined;
  Clientes: { novoCliente: boolean } | undefined;
  Produtos: { novoProduto: boolean } | undefined;
  Fornecedores: { novoFornecedor: boolean } | undefined;
  NovoCliente: {
    modo: "criar" | "editar";
    clienteId?: string;
  } | undefined;

  NovoProduto: {
    modo: "criar" | "editar"
    produtoId?: string
  } | undefined;

  NovoFornecedor: {
    modo: "criar" | "editar"
    fornecedorId?: string
  } | undefined;

  NovoFuncionario: {
    modo: "criar" | "editar",
    funcionarioId?: string
  } | undefined;

  UserPerfil:
  | {
    id: string;
    nome: string;
    funcao: string;
    email: string;
    data_nascimento: string;
    genero: string;
    estado_civil: string;
    rg: string;
    cpf: string;
    telefone: string;
    endereco_id: number;
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    numero: string;
  }
  | undefined;
};

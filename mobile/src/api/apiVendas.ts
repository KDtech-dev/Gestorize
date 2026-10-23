import { getAxios } from '@configs/axios';
import { ProdutoType, ResponseType } from '@context/types';

export type FormaPagamento = 'pix' | 'dinheiro' | 'debito' | 'credito';

export type VendaItem = {
  id: string;
  produto_id: string | null;
  produto_nome: string;
  codigo_barras: string | null;
  quantidade: number;
  preco_unitario: number | string;
  subtotal: number | string;
};

export type VendaType = {
  id: string;
  usuario_id?: string;
  valor_total: number | string;
  vendido_em: string;
  vendedor: string | null;
  forma_pagamento?: 'pix' | 'dinheiro' | 'debito' | 'credito' | null;
  desconto?: number | string;
  orcamento_id?: string | null;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  itens: VendaItem[];
};

export const getVendas = async (): Promise<ResponseType<VendaType[]>> => {
  const response = await getAxios().get('/vendas');
  return response.data;
};

export const registrarVenda = async (
  itens: Array<{ produto_id: string; quantidade: number }>,
  clienteId?: string | null,
  opcoes?: { orcamentoId?: string | null; formaPagamento?: FormaPagamento; desconto?: number },
): Promise<ResponseType<VendaType>> => {
  const response = await getAxios().post('/vendas', {
    itens,
    cliente_id: clienteId ?? null,
    orcamento_id: opcoes?.orcamentoId ?? null,
    forma_pagamento: opcoes?.formaPagamento ?? 'pix',
    desconto: opcoes?.desconto ?? 0,
  });
  return response.data;
};

export const getProdutoPorCodigo = async (codigo: string): Promise<ResponseType<ProdutoType>> => {
  const response = await getAxios().get(`/produtos/codigo/${encodeURIComponent(codigo)}`);
  return response.data;
};

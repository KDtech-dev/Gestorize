import { getAxios } from '@configs/axios';
import { ProdutoType, ResponseType } from '@context/types';

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
): Promise<ResponseType<VendaType>> => {
  const response = await getAxios().post('/vendas', { itens, cliente_id: clienteId ?? null });
  return response.data;
};

export const getProdutoPorCodigo = async (codigo: string): Promise<ResponseType<ProdutoType>> => {
  const response = await getAxios().get(`/produtos/codigo/${encodeURIComponent(codigo)}`);
  return response.data;
};

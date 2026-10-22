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
  valor_total: number | string;
  vendido_em: string;
  vendedor: string | null;
  itens: VendaItem[];
};

export const getVendas = async (): Promise<ResponseType<VendaType[]>> => {
  const response = await getAxios().get('/vendas');
  return response.data;
};

export const registrarVenda = async (
  itens: Array<{ produto_id: string; quantidade: number }>,
): Promise<ResponseType<VendaType>> => {
  const response = await getAxios().post('/vendas', { itens });
  return response.data;
};

export const getProdutoPorCodigo = async (codigo: string): Promise<ResponseType<ProdutoType>> => {
  const response = await getAxios().get(`/produtos/codigo/${encodeURIComponent(codigo)}`);
  return response.data;
};

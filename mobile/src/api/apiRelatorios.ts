import { getAxios } from '@configs/axios';

export type PeriodoRelatorio = 'hoje' | 'semana' | 'mes' | 'ano';
export type TipoRelatorio = 'movimentacao' | 'orcamentos' | 'clientes' | 'produtos' | 'vendas';

export type RelatorioResponse = {
  periodo: PeriodoRelatorio;
  tipo: TipoRelatorio;
  intervalo: { inicio: string; fim: string };
  nota: string;
  metricas: {
    valor_orcado: { valor: number; variacao: number | null };
    orcamentos: { valor: number; variacao: number | null };
    clientes: { valor: number; variacao: number | null };
    vendas: { valor: number; variacao: number | null };
    faturamento_vendas: { valor: number; variacao: number | null };
  };
  totais: {
    valor_orcado: number;
    orcamentos: number;
    aprovacoes: number;
    pendentes: number;
    clientes: number;
    produtos: number;
    vendas: number;
    faturamento_vendas: number;
    descontos_vendas: number;
    formas_pagamento: { forma: string; quantidade: number; valor: number }[];
  };
  serie: {
    rotulos: string[];
    rotulos_vendas: string[];
    valores: number[];
    vendas: number[];
    faturamento: number[];
    categorias: { nome: string; quantidade: number }[];
  };
};

export const getRelatorio = async (periodo: PeriodoRelatorio, tipo: TipoRelatorio) => {
  const response = await getAxios().get<{ data: RelatorioResponse }>('/relatorios', {
    params: { periodo, tipo },
  });
  return response.data.data;
};

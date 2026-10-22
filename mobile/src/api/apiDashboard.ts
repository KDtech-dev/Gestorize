import { getAxios } from '@configs/axios';

export type DashboardResumo = {
  clientes: number;
  orcamentos_aprovados: number;
  orcamentos_pendentes: number;
  produtos_em_estoque: number;
};

export const getDashboardResumo = async (): Promise<DashboardResumo> => {
  const response = await getAxios().get<{ data: DashboardResumo }>('/dashboard/resumo');
  return response.data.data;
};

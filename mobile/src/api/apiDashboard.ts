import { getAxios } from '@configs/axios';

export type DashboardResumo = {
  clientes: number | null;
  orcamentos_aprovados: number | null;
  orcamentos_pendentes: number | null;
  produtos_em_estoque: number | null;
};

export const getDashboardResumo = async (): Promise<DashboardResumo> => {
  const response = await getAxios().get<{ data: DashboardResumo }>('/dashboard/resumo');
  return response.data.data;
};

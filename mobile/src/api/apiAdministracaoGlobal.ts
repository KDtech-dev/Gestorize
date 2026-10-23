import { getAxios } from '@configs/axios';

export type OrganizacaoGlobalResumo = {
  id: string;
  name: string;
  active: boolean;
  users_count: number;
};

export type MetricasGlobais = {
  organizations_total: number;
  organizations_active: number;
  organizations_inactive: number;
  organizations_created_this_month: number;
  users_total: number;
  users_active: number;
  users_inactive: number;
  managers_active: number;
  employees_active: number;
  organizations: OrganizacaoGlobalResumo[];
};

export const getMetricasGlobais = async () => {
  const response = await getAxios().get<{ data: MetricasGlobais }>('/organizations/metrics');
  return response.data.data;
};

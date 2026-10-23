import { getAxios } from '@configs/axios';

export type OrganizationType = {
  id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  active: boolean;
  users_count: number;
};

export const getOrganizacoes = async (): Promise<OrganizationType[]> => {
  const response = await getAxios().get('/organizations');
  return response.data.data;
};

export const createOrganizacao = async (data: Record<string, unknown>) => {
  const response = await getAxios().post('/organizations', data);
  return response.data.data as OrganizationType;
};

export const updateOrganizacao = async (id: string, data: Partial<OrganizationType>) => {
  const response = await getAxios().put(`/organizations/${id}`, data);
  return response.data.data as OrganizationType;
};


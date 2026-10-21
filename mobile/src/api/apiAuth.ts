import { authStorage, api } from '@configs/axios';
import auth from '@configs/auth';
import { LoginData, RefreshData } from '@context/requestTypes';
import { ResponseType } from '@context/types';
import { secureStore } from '@utils/secureStore';
import { getAxios } from '@configs/axios';
import type { UserType } from '@context/types';

const unwrap = (responseData: any) => responseData?.data ?? responseData;

const normalizeRoles = (roles: any): string[] => {
  if (Array.isArray(roles)) {
    return roles.map((role) => String(role)).filter(Boolean);
  }

  if (typeof roles === 'string' && roles.trim()) {
    return [roles.trim()];
  }

  return [];
};

const normalizeAuthPayload = (payload: any): LoginData => {
  if (!payload?.token || !payload?.user) {
    throw new Error('Resposta de autenticação inválida.');
  }

  const user = payload.user;

  return {
    token: String(payload.token),

    user: {
      ...user,
      id: String(user.id),
      nome: user.nome ?? user.name ?? '',
      email: user.email ?? '',
      roles: normalizeRoles(user.roles),
      permissions: normalizeRoles(user.permissions),
    },
  };
};

export async function postLogin(
  email: string,
  password: string,
): Promise<LoginData> {
  const { data } = await api.post<ResponseType<LoginData>>('/login', {
    email,
    password,
  });

  return normalizeAuthPayload(unwrap(data));
}

export const getCurrentUser = async (): Promise<ResponseType<UserType>> => {
  const response = await getAxios().get('/me');
  const payload = response.data;
  return {
    ...payload,
    data: {
      ...payload.data,
      nome: payload.data?.nome ?? payload.data?.name ?? '',
    },
  };
};

export const updateCurrentUser = async (data: Record<string, unknown>): Promise<ResponseType<UserType>> => {
  const response = await getAxios().put('/me', data);
  const payload = response.data;
  return {
    ...payload,
    data: { ...payload.data, nome: payload.data?.nome ?? payload.data?.name ?? '' },
  };
};

export const postRefreshToken = async (): Promise<RefreshData> => {
  const { data } = await api.post<ResponseType<RefreshData>>(
    auth.refreshEndpoint,
  );
  const payload = normalizeAuthPayload(unwrap(data));
  await authStorage.set(payload.token);
  await secureStore.set(auth.userDataKeyName, JSON.stringify(payload.user));

  return payload;
};

export const postLogout = async (): Promise<void> => {
  await api.post(auth.logoutEndpoint);
  await authStorage.set(null);
  await secureStore.remove(auth.userDataKeyName);
};

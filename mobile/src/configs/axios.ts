import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

import auth from './auth';
import { secureStore } from '@utils/secureStore';

let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export const setUnauthorizedHandler = (
  handler: (() => void | Promise<void>) | null,
) => {
  unauthorizedHandler = handler;
};

export const authStorage = {
  async get(): Promise<string | null> {
    return secureStore.get(auth.storageTokenKeyName);
  },

  async set(token: string | null): Promise<void> {
    await secureStore.set(
      auth.storageTokenKeyName,
      token,
    );
  },
};

type AxiosOpts = {
  contentType?:
  | 'application/json'
  | 'multipart/form-data'
  | 'formData'
  | string;

  timeoutMs?: number;
};

const DEVELOPMENT_API_URL = 'http://10.220.84.176:8000/api';
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

function resolveApiBaseURL(): string | null {
  const candidate = __DEV__
    ? configuredApiUrl || DEVELOPMENT_API_URL
    : configuredApiUrl;

  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    if (!url.hostname || url.username || url.password) return null;
    if (!__DEV__ && url.protocol !== 'https:') return null;
    if (__DEV__ && !['http:', 'https:'].includes(url.protocol)) return null;

    return candidate.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

const API_BASE_URL = resolveApiBaseURL();

export const getAxios = ({
  contentType,
  timeoutMs,
}: AxiosOpts = {}): AxiosInstance => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (contentType && contentType !== 'formData') {
    headers['Content-Type'] = contentType;
  }

  const instance = axios.create({
    baseURL: API_BASE_URL ?? undefined,
    timeout: timeoutMs ?? 15000,
    headers,
  });

  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      if (!API_BASE_URL) {
        return Promise.reject(
          new Error(
            __DEV__
              ? 'EXPO_PUBLIC_API_URL precisa ser uma URL HTTP ou HTTPS válida.'
              : 'Configure EXPO_PUBLIC_API_URL com uma URL HTTPS válida para a API.',
          ),
        );
      }

      try {
        const baseUrl = new URL(API_BASE_URL);
        const requestUrl = new URL(config.url ?? '', baseUrl);
        if (
          requestUrl.origin !== baseUrl.origin ||
          (!__DEV__ && requestUrl.protocol !== 'https:')
        ) {
          return Promise.reject(new Error('Destino da API não permitido.'));
        }
      } catch {
        return Promise.reject(new Error('URL de destino da API inválida.'));
      }

      const token = await authStorage.get();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
  );

  instance.interceptors.response.use(
    (response) => response,

    async (error) => {
      if (error.response?.status === 401) {
        await authStorage.set(null);
        await unauthorizedHandler?.();
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

export const api = getAxios();

export default api;

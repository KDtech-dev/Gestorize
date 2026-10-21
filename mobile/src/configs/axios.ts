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
    baseURL: 'http://192.168.21.143:8000/api',
    timeout: timeoutMs ?? 15000,
    headers,
  });

  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
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
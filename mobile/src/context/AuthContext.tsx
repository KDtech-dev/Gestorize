import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { postLogin, postLogout } from '../api/apiAuth';
import Toast from 'react-native-toast-message';
import authConfig from '../configs/auth';
import { secureStore } from '../utils/secureStore';
import { formatErrorMessage } from '@core/utils/format';
import { setUnauthorizedHandler } from '@configs/axios';

type AuthContextType = {
  token: string | null;
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStoredAuth = useCallback(async () => {
    setToken(null);
    setUser(null);
    setExpiresAt(null);
    await secureStore.remove(authConfig.storageTokenKeyName);
    await secureStore.remove(authConfig.userDataKeyName);
    await secureStore.remove(authConfig.expiresAtKeyName);
    await secureStore.remove(authConfig.rememberKeyName);
  }, []);

  useEffect(() => {
    const loadStoredAuth = async () => {
      const storedToken = await secureStore.get(authConfig.storageTokenKeyName);
      const storedUser = await secureStore.get(authConfig.userDataKeyName);
      const storedExpiry = await secureStore.get(authConfig.expiresAtKeyName);
      const remember = await secureStore.get(authConfig.rememberKeyName);

      const expiryTimestamp = storedExpiry ? Date.parse(storedExpiry) : NaN;
      if (!storedToken || remember !== 'true' || !Number.isFinite(expiryTimestamp) || expiryTimestamp <= Date.now()) {
        await clearStoredAuth();
        setLoading(false);
        return;
      }

      setToken(storedToken);
      setExpiresAt(expiryTimestamp);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          await secureStore.remove(authConfig.userDataKeyName);
        }
      }

      setLoading(false);
    };

    loadStoredAuth();
  }, [clearStoredAuth]);

  useEffect(() => {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    if (!token || !expiresAt) return;

    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      void clearStoredAuth();
      Toast.show({ type: 'info', text1: 'Sessão encerrada', text2: 'Seu acesso expirou após 3 horas.' });
      return;
    }

    expiryTimer.current = setTimeout(() => {
      void clearStoredAuth();
      Toast.show({ type: 'info', text1: 'Sessão encerrada', text2: 'Seu acesso expirou após 3 horas.' });
    }, remaining);

    return () => {
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
    };
  }, [token, expiresAt, clearStoredAuth]);

  useEffect(() => {
    const verifyExpiry = (state: AppStateStatus) => {
      if (state === 'active' && token && expiresAt && Date.now() >= expiresAt) {
        void clearStoredAuth();
        Toast.show({ type: 'info', text1: 'Sessão encerrada', text2: 'Seu acesso expirou após 3 horas.' });
      }
    };

    const subscription = AppState.addEventListener('change', verifyExpiry);
    return () => subscription.remove();
  }, [token, expiresAt, clearStoredAuth]);

  useEffect(() => {
    setUnauthorizedHandler(clearStoredAuth);

    return () => setUnauthorizedHandler(null);
  }, [clearStoredAuth]);

  const signIn = async (email: string, password: string, remember: boolean) => {
    setLoading(true);

    try {
      const response = await postLogin(email, password, remember);
      const { token, user } = response;
      const expiryTimestamp = response.expires_at
        ? Date.parse(response.expires_at)
        : Date.now() + 3 * 60 * 60 * 1000;

      if (!Number.isFinite(expiryTimestamp) || expiryTimestamp <= Date.now()) {
        throw new Error('A sessão recebida já está expirada. Faça login novamente.');
      }

      setToken(token);
      setUser(user);
      setExpiresAt(expiryTimestamp);

      await secureStore.set(authConfig.storageTokenKeyName, token);
      await secureStore.set(authConfig.userDataKeyName, JSON.stringify(user));
      await secureStore.set(authConfig.expiresAtKeyName, new Date(expiryTimestamp).toISOString());
      await secureStore.set(authConfig.rememberKeyName, remember ? 'true' : 'false');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro no login',
        text2: formatErrorMessage(error, 'Erro no login'),
        visibilityTime: 1000,
        topOffset: 50,
        props: { rightOffset: 40 },
      });

      setToken(null);
      setUser(null);
      setExpiresAt(null);
      await secureStore.remove(authConfig.storageTokenKeyName);
      await secureStore.remove(authConfig.userDataKeyName);
      await secureStore.remove(authConfig.expiresAtKeyName);
      await secureStore.remove(authConfig.rememberKeyName);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await postLogout();
    } catch (e) {
      const status = (e as any)?.response?.status;
      if (status === 401 || status === 419) {
        await clearStoredAuth();
        return;
      }

      Toast.show({
        type: 'error',
        text1: 'Erro ao sair',
        text2: formatErrorMessage(e, 'Erro ao sair:'),
      });
    } finally {
      await clearStoredAuth();
    }
  };

  const updateUser = async (updatedUser: any) => {
    setUser((current: any) => ({ ...current, ...updatedUser }));
    const storedUser = await secureStore.get(authConfig.userDataKeyName);
    let current = {};
    try { current = storedUser ? JSON.parse(storedUser) : {}; } catch { current = {}; }
    await secureStore.set(authConfig.userDataKeyName, JSON.stringify({ ...current, ...updatedUser }));
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

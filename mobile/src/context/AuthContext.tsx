import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
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
  signIn: (email: string, password: string) => Promise<void>;
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

  const clearStoredAuth = useCallback(async () => {
    setToken(null);
    setUser(null);
    await secureStore.remove(authConfig.storageTokenKeyName);
    await secureStore.remove(authConfig.userDataKeyName);
  }, []);

  useEffect(() => {
    const loadStoredAuth = async () => {
      const storedToken = await secureStore.get(authConfig.storageTokenKeyName);
      const storedUser = await secureStore.get(authConfig.userDataKeyName);

      if (storedToken) setToken(storedToken);
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
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearStoredAuth);

    return () => setUnauthorizedHandler(null);
  }, [clearStoredAuth]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    try {
      const { token, user } = await postLogin(email, password);

      setToken(token);
      setUser(user);

      await secureStore.set(authConfig.storageTokenKeyName, token);
      await secureStore.set(authConfig.userDataKeyName, JSON.stringify(user));
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

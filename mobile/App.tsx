import 'react-native-url-polyfill/auto';
import React from 'react';
import Toast from 'react-native-toast-message';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '@views/Login';
import { AuthProvider, useAuth } from '@context/AuthContext';
import Homepage from '@views/Homepage';
import Clientes from '@views/Clientes/index';
import Produtos from '@views/Produtos/index';
import Fornecedores from '@views/Fornecedores/index';
import Funcionarios from '@views/Funcionarios/index';
import { RootStackParamList } from '@context/types';
import UserPerfil from '@views/perfil/UserPerfil';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider, useThemeToggle } from '@context/ThemeContext';
import lightTheme from './src/theme/paperTheme';
import darkTheme from './src/theme/paperThemeDark';
import Orcamentos from '@views/Orcamentos/index';
import { MenuProvider } from '@context/MenuContext';
import toastConfig from '@components/ui/ToastConfig';
import Relatorios from '@views/Relatorios/index';
import Configuracoes from '@views/Configuracoes';
import { canAccessForm, canAccessRoute } from '@utils/permissions';
import Ajuda from '@views/Ajuda';
import NovoCliente from '@views/Clientes/NovoCliente';
import NovoProduto from '@views/Produtos/NovoProduto';
import NovoFornecedor from '@views/Fornecedores/NovoFornecedor';
import NovoFuncionario from '@views/Funcionarios/NovoFuncionario';
import NovoOrcamento from '@views/Orcamentos/NovoOrcamento';
import Vendas from '@views/Vendas';
import NovaVenda from '@views/Vendas/NovaVenda';
import Organizacoes from '@views/Organizacoes';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const AppNavigator = () => {
  const { token, loading, user } = useAuth();

  if (loading) return null;

  const canAccess = (routeName: keyof RootStackParamList) =>
    canAccessRoute(user, routeName);

  return (
    <MenuProvider navigationRef={navigationRef}>
      <Stack.Navigator
        key={token ? 'app-stack' : 'auth-stack'}
        screenOptions={{ headerShown: false }}
      >
        {!token ? (
          <>
            <Stack.Screen name="Login" component={Login} />
          </>
        ) : (
          <>
            <Stack.Screen name="Homepage" component={Homepage} />
            {canAccess('Organizacoes') && <Stack.Screen name="Organizacoes" component={Organizacoes} />}
            {canAccess('Vendas') && <Stack.Screen name="Vendas" component={Vendas} />}
            {canAccess('NovaVenda') && <Stack.Screen name="NovaVenda" component={NovaVenda} />}
            <Stack.Screen name="Configuracoes" component={Configuracoes} />

            <Stack.Screen name="Ajuda" component={Ajuda} />
            <Stack.Screen name="UserPerfil" component={UserPerfil} />
            {canAccess('Clientes') && <Stack.Screen name="Clientes" component={Clientes} />}
            {canAccessForm(user, 'clientes') && <Stack.Screen name="NovoCliente" component={NovoCliente} />}
            {canAccess('Produtos') && <Stack.Screen name="Produtos" component={Produtos} />}
            {canAccessForm(user, 'produtos') && <Stack.Screen name="NovoProduto" component={NovoProduto} />}
            {canAccess('Fornecedores') && <Stack.Screen name="Fornecedores" component={Fornecedores} />}
            {canAccessForm(user, 'fornecedores') && <Stack.Screen name="NovoFornecedor" component={NovoFornecedor} />}
            {canAccess('Funcionarios') && <Stack.Screen name="Funcionarios" component={Funcionarios} />}
            {canAccessForm(user, 'users') && <Stack.Screen name="NovoFuncionario" component={NovoFuncionario} />}
            {canAccess('Orcamentos') && <Stack.Screen name="Orcamentos" component={Orcamentos} />}
            {canAccessForm(user, 'orcamentos') && <Stack.Screen name="NovoOrcamento" component={NovoOrcamento} />}
            {canAccess('Relatorios') && (
              <Stack.Screen name="Relatorios" component={Relatorios} />
            )}
          </>
        )}
      </Stack.Navigator>
    </MenuProvider>
  );
};

const PaperThemedProvider = ({ children }: { children: React.ReactNode }) => {
  const { mode } = useThemeToggle();
  const paper = mode === 'light' ? lightTheme : darkTheme;
  return <PaperProvider theme={paper}>{children}</PaperProvider>;
};

const App = () => (
  <AuthProvider>
    <ThemeProvider>
      <PaperThemedProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
        <Toast config={toastConfig} />
      </PaperThemedProvider>
    </ThemeProvider>
  </AuthProvider>
);
export default App;

import React, { useState } from 'react';
import { View } from 'react-native';
import { SideMenu } from '@components/SideMenu';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@context/types';
import { canAccessRoute } from '@utils/permissions';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut, user } = useAuth();

  const mainMenu = [
    {
      route: 'Clientes' as const,
      icon: 'account-group' as const,
      label: 'Clientes',
      onPress: () => navigation.navigate('Clientes'),
    },
    {
      route: 'Produtos' as const,
      icon: 'cube-outline' as const,
      label: 'Produtos',
      onPress: () => navigation.navigate('Produtos'),
    },
    {
      route: 'Fornecedores' as const,
      icon: 'truck-fast-outline' as const,
      label: 'Fornecedores',
      onPress: () => navigation.navigate('Fornecedores'),
    },
    {
      route: 'Orcamentos' as const,
      icon: 'file-document-outline' as const,
      label: 'Orçamentos',
      onPress: () => navigation.navigate('Orcamentos'),
    },
    {
      route: 'Vendas' as const,
      icon: 'point-of-sale' as const,
      label: 'Vendas',
      onPress: () => navigation.navigate('Vendas'),
    },
    {
      route: 'Funcionarios' as const,
      icon: 'account-tie' as const,
      label: 'Funcionários',
      onPress: () => navigation.navigate('Funcionarios'),
    },
    {
      route: 'Relatorios' as const,
      icon: 'chart-bar' as const,
      label: 'Relatórios',
      onPress: () => {},
      disabled: true,
    },
  ].filter((item) => canAccessRoute(user, item.route));

  const bottomMenu = [
    {
      icon: 'cog' as const,
      label: 'Configurações',
      onPress: () => navigation.navigate('Configuracoes'),
    },
    {
      icon: 'help-circle' as const,
      label: 'Ajuda',
      onPress: () => navigation.navigate('Ajuda'),
    },
    {
      icon: 'logout' as const,
      label: 'Sair',
      onPress: async () => {
        await signOut();
        setMenuOpen(false);
      },
      danger: true,
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      {children}

      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        menuItems={mainMenu}
        bottomItems={bottomMenu}
      />
    </View>
  );
};

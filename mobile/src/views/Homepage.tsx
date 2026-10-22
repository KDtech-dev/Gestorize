import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeHeader from '@components/HomeHeader';
import { NavButton } from '@components/botoes/nav-buttons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@context/types';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { canAccessRoute } from '@utils/permissions';
import { DashboardResumo, getDashboardResumo } from '@api/apiDashboard';

const metricColors = {
  clientes: '#6D28D9',
  aprovados: '#047857',
  pendentes: '#C2410C',
  estoque: '#1D4ED8',
} as const;

const Homepage = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregandoResumo(true);
      getDashboardResumo()
        .then((dados) => { if (ativo) setResumo(dados); })
        .catch(() => { if (ativo) setResumo(null); })
        .finally(() => { if (ativo) setCarregandoResumo(false); });

      return () => { ativo = false; };
    }, []),
  );

  const metricas = [
    { id: 'clientes', titulo: 'Clientes cadastrados', valor: resumo?.clientes, icon: 'account-group-outline' as const, cor: metricColors.clientes },
    { id: 'aprovados', titulo: 'Orçamentos aprovados', valor: resumo?.orcamentos_aprovados, icon: 'check-decagram-outline' as const, cor: metricColors.aprovados },
    { id: 'pendentes', titulo: 'Orçamentos pendentes', valor: resumo?.orcamentos_pendentes, icon: 'clock-outline' as const, cor: metricColors.pendentes },
    { id: 'estoque', titulo: 'Produtos com estoque', valor: resumo?.produtos_em_estoque, icon: 'cube-outline' as const, cor: metricColors.estoque },
  ];

  const quickActions = [
    {
      route: 'Clientes' as const,
      icon: 'account-group' as const,
      label: 'Clientes',
      description: 'Cadastre, edite e acompanhe seus clientes',
    },
    {
      route: 'Produtos' as const,
      icon: 'cube-outline' as const,
      label: 'Produtos',
      description: 'Gerencie catálogo, preços e estoque',
    },
    {
      route: 'Fornecedores' as const,
      icon: 'truck-fast-outline' as const,
      label: 'Fornecedores',
      description: 'Controle parceiros e histórico de compras',
    },
    {
      route: 'Orcamentos' as const,
      icon: 'file-document-outline' as const,
      label: 'Orçamentos',
      description: 'Crie, organize e acompanhe propostas',
    },
    {
      route: 'Funcionarios' as const,
      icon: 'account-tie' as const,
      label: 'Funcionários',
      description: 'Gerencie equipe, funções e acessos',
    },
    {
      route: 'Relatorios' as const,
      icon: 'chart-bar' as const,
      label: 'Relatórios',
      description: 'Visualize métricas e desempenhos',
    },
  ].filter((item) => canAccessRoute(user, item.route));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HomeHeader />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.metricsHeader}>
            <View>
              <Text variant="titleMedium" style={[styles.sectionTitle, styles.metricsTitle, { color: colors.text }]}>Resumo do sistema</Text>
              <Text style={[styles.metricsSubtitle, { color: colors.muted }]}>Indicadores atualizados ao abrir esta tela</Text>
            </View>
            {carregandoResumo ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          </View>
          <FlatList
            data={metricas}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.metricsList}
            renderItem={({ item }) => (
              <View style={[styles.metricCard, { backgroundColor: item.cor }]}>
                <View style={styles.metricCardTop}>
                  <Text style={styles.metricLabel}>{item.titulo}</Text>
                  <MaterialCommunityIcons name={item.icon} size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.metricValue}>{item.valor == null ? '—' : item.valor.toLocaleString('pt-BR')}</Text>
                <Text style={styles.metricFootnote}>{resumo ? 'Total registrado' : 'Dados indisponíveis'}</Text>
              </View>
            )}
          />

          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Acesso Rápido
          </Text>
          <View style={styles.grid}>
            {quickActions.map((item) => (
              <NavButton
                key={item.route}
                icon={item.icon}
                label={item.label}
                description={item.description}
                onClick={() => navigation.navigate(item.route)}
                containerStyle={styles.gridItem}
              />
            ))}
          </View>

          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Mais Opções
          </Text>
          <View style={styles.grid}>
            <NavButton
              icon="cog"
              label="Configurações"
              description="Personalize preferências e ajustes do sistema"
              onClick={() => navigation.navigate('Configuracoes')}
              containerStyle={styles.gridItem}
            />

            <NavButton
              icon="help-circle"
              label="Ajuda"
              description="Suporte, dúvidas frequentes e orientações"
              onClick={() => navigation.navigate('Ajuda')}
              containerStyle={styles.gridItem}
            />
          </View>
        </View>

        <StatusBar style={colors.background === '#ffffff' ? 'dark' : 'light'} />
      </ScrollView>
    </View>
  );
};

export default Homepage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 4,
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 18,
  },
  metricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricsTitle: { marginBottom: 0 },
  metricsSubtitle: { fontSize: 12, marginTop: 3 },
  metricsList: { gap: 12, paddingVertical: 4, paddingRight: 16 },
  metricCard: {
    width: 190,
    minHeight: 126,
    borderRadius: 18,
    padding: 16,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  metricCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  metricLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },
  metricValue: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 8 },
  metricFootnote: { color: '#FFFFFFD9', fontSize: 11, marginTop: 1 },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 18,
  },
  gridItem: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  cardsWrapper: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
});

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import HomeHeader from '@components/HomeHeader';
import { NavButton } from '@components/botoes/nav-buttons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@context/types';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { can, canAccessRoute } from '@utils/permissions';
import { DashboardResumo, getDashboardResumo } from '@api/apiDashboard';

const metricColors = {
  clientes: { base: '#5B21B6', highlight: '#7C3AED', sheen: '#8B5CF6', shadow: '#3B0764' },
  aprovados: { base: '#047857', highlight: '#059669', sheen: '#10B981', shadow: '#064E3B' },
  pendentes: { base: '#C2410C', highlight: '#EA580C', sheen: '#F97316', shadow: '#7C2D12' },
  estoque: { base: '#1D4ED8', highlight: '#2563EB', sheen: '#3B82F6', shadow: '#172554' },
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
    { id: 'clientes', titulo: 'Clientes cadastrados', valor: resumo?.clientes, permissao: 'clientes.ver', icon: 'account-group-outline' as const, cores: metricColors.clientes },
    { id: 'aprovados', titulo: 'Orçamentos aprovados', valor: resumo?.orcamentos_aprovados, permissao: 'orcamentos.ver', icon: 'check-decagram-outline' as const, cores: metricColors.aprovados },
    { id: 'pendentes', titulo: 'Orçamentos pendentes', valor: resumo?.orcamentos_pendentes, permissao: 'orcamentos.ver', icon: 'clock-outline' as const, cores: metricColors.pendentes },
    { id: 'estoque', titulo: 'Produtos com estoque', valor: resumo?.produtos_em_estoque, permissao: 'produtos.ver', icon: 'cube-outline' as const, cores: metricColors.estoque },
  ].filter((item) => can(user, item.permissao));

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
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentWrapper}>
          <View style={[styles.welcomePanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.welcomeCopy}>
              <Text style={[styles.welcomeEyebrow, { color: colors.primary }]}>PAINEL DE CONTROLE</Text>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>Olá, {(user?.nome ?? user?.name ?? 'bem-vindo').split(' ')[0]}</Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.muted }]}>Acompanhe sua operação em um só lugar.</Text>
            </View>
            <View style={[styles.welcomeIcon, { backgroundColor: colors.elevated }]}>
              <MaterialCommunityIcons name="view-dashboard-outline" size={26} color={colors.primary} />
            </View>
          </View>

          <View style={styles.metricsHeader}>
            <View>
              <View style={styles.sectionHeading}>
                <MaterialCommunityIcons name="chart-box-outline" size={21} color={colors.primary} />
                <Text variant="titleMedium" style={[styles.sectionTitle, styles.metricsTitle, { color: colors.text }]}>Resumo do sistema</Text>
              </View>
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
              <View style={[styles.metricCard, { borderColor: item.cores.highlight }]}>
                <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Defs>
                    <LinearGradient id={`metal-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={item.cores.highlight} />
                      <Stop offset="0.32" stopColor={item.cores.base} />
                      <Stop offset="0.49" stopColor={item.cores.sheen} />
                      <Stop offset="0.57" stopColor={item.cores.base} />
                      <Stop offset="1" stopColor={item.cores.shadow} />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="100%" rx="19" fill={`url(#metal-${item.id})`} />
                </Svg>
                <View style={styles.metricCardTop}>
                  <Text style={styles.metricLabel}>{item.titulo}</Text>
                  <MaterialCommunityIcons name={item.icon} size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.metricValue}>{item.valor == null ? '—' : item.valor.toLocaleString('pt-BR')}</Text>
                <Text style={styles.metricFootnote}>{resumo ? 'Total registrado' : 'Dados indisponíveis'}</Text>
              </View>
            )}
          />

          <View style={styles.sectionHeading}>
            <MaterialCommunityIcons name="lightning-bolt-outline" size={21} color={colors.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>Acesso Rápido</Text>
          </View>
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

          <View style={styles.sectionHeading}>
            <MaterialCommunityIcons name="dots-horizontal-circle-outline" size={21} color={colors.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>Mais Opções</Text>
          </View>
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
  scrollContent: { paddingBottom: 20 },
  welcomePanel: {
    minHeight: 104,
    marginTop: 14,
    marginBottom: 3,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  welcomeCopy: { flex: 1, gap: 3 },
  welcomeEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.15 },
  welcomeTitle: { fontSize: 23, lineHeight: 29, fontWeight: '900' },
  welcomeSubtitle: { fontSize: 13, lineHeight: 18 },
  welcomeIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: {
    marginTop: 0,
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
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  metricsTitle: { marginTop: 0, marginBottom: 0 },
  metricsSubtitle: { fontSize: 12, marginTop: 3 },
  metricsList: { gap: 12, paddingVertical: 4, paddingRight: 16 },
  metricCard: {
    width: 190,
    minHeight: 126,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
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

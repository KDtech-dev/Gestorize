import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { can, canAccessRoute, canSell } from '@utils/permissions';
import { DashboardResumo, getDashboardResumo } from '@api/apiDashboard';
import { getVendas, VendaType } from '@api/apiVendas';

const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const metricColors = {
  clientes: '#6D5CE8',
  aprovados: '#16845B',
  pendentes: '#C36A1D',
  estoque: '#3478C8',
  vendas: '#16845B',
  faturamento: '#087F8C',
} as const;

const Homepage = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const podeVender = canSell(user);
  const podeVerVendas = can(user, 'vendas.ver');
  const administradorGlobal = user?.role === 'admin' && !user?.organization_id;
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [vendas, setVendas] = useState<VendaType[]>([]);
  const [vendasCarregadas, setVendasCarregadas] = useState(false);
  const [carregandoResumo, setCarregandoResumo] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregandoResumo(true);
      Promise.allSettled([
        administradorGlobal ? Promise.resolve(null) : getDashboardResumo(),
        !administradorGlobal && podeVerVendas ? getVendas() : Promise.resolve(null),
      ]).then(([resumoResult, vendasResult]) => {
        if (!ativo) return;
        setResumo(resumoResult.status === 'fulfilled' ? resumoResult.value : null);
        setVendas(vendasResult.status === 'fulfilled' && vendasResult.value ? vendasResult.value.data ?? [] : []);
        setVendasCarregadas(vendasResult.status === 'fulfilled');
      }).finally(() => { if (ativo) setCarregandoResumo(false); });

      return () => { ativo = false; };
    }, [podeVerVendas, administradorGlobal]),
  );

  const hoje = new Date();
  const vendasHoje = vendas.filter((venda) => {
    const data = new Date(venda.vendido_em);
    return data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth() && data.getDate() === hoje.getDate();
  });
  const faturamentoHoje = vendasHoje.reduce((total, venda) => total + Number(venda.valor_total), 0);

  const metricas = [
    { id: 'vendas', titulo: 'Vendas hoje', valor: vendasCarregadas ? vendasHoje.length : null, permissao: 'vendas.ver', icon: 'receipt-text-outline' as const, cores: metricColors.vendas, rodape: vendasCarregadas ? 'Vendas concluídas hoje' : 'Dados de vendas indisponíveis' },
    { id: 'faturamento', titulo: 'Faturamento hoje', valor: vendasCarregadas ? faturamentoHoje : null, permissao: 'vendas.ver', icon: 'cash-multiple' as const, cores: metricColors.faturamento, formato: 'moeda' as const, rodape: vendasCarregadas ? 'Soma das vendas de hoje' : 'Dados de vendas indisponíveis' },
    { id: 'clientes', titulo: 'Clientes cadastrados', valor: resumo?.clientes, permissao: 'clientes.ver', icon: 'account-group-outline' as const, cores: metricColors.clientes },
    { id: 'aprovados', titulo: 'Orçamentos aprovados', valor: resumo?.orcamentos_aprovados, permissao: 'orcamentos.ver', icon: 'check-decagram-outline' as const, cores: metricColors.aprovados },
    { id: 'pendentes', titulo: 'Orçamentos pendentes', valor: resumo?.orcamentos_pendentes, permissao: 'orcamentos.ver', icon: 'clock-outline' as const, cores: metricColors.pendentes },
    { id: 'estoque', titulo: 'Produtos com estoque', valor: resumo?.produtos_em_estoque, permissao: 'produtos.ver', icon: 'cube-outline' as const, cores: metricColors.estoque },
  ].filter((item) => !administradorGlobal && can(user, item.permissao));

  const quickActions = [
    {
      route: 'Organizacoes' as const,
      icon: 'domain' as const,
      label: 'Organizações',
      description: 'Crie organizações e cadastre o gestor responsável',
    },
    {
      route: 'Clientes' as const,
      icon: 'account-group' as const,
      label: 'Clientes',
      description: 'Consulte e mantenha seus cadastros',
    },
    {
      route: 'Produtos' as const,
      icon: 'cube-outline' as const,
      label: 'Produtos',
      description: 'Consulte produtos, preços e estoque',
    },
    {
      route: 'Fornecedores' as const,
      icon: 'truck-fast-outline' as const,
      label: 'Fornecedores',
      description: 'Consulte os parceiros cadastrados',
    },
    {
      route: 'Orcamentos' as const,
      icon: 'file-document-outline' as const,
      label: 'Orçamentos',
      description: 'Crie e acompanhe propostas comerciais',
    },
    {
      route: 'Vendas' as const,
      icon: 'point-of-sale' as const,
      label: 'Vendas',
      description: 'Acompanhe histórico, faturamento e resultados',
    },
    {
      route: 'Funcionarios' as const,
      icon: 'account-tie' as const,
      label: 'Funcionários',
      description: 'Consulte equipe, funções e acessos',
    },
    {
      route: 'Relatorios' as const,
      icon: 'chart-bar' as const,
      label: 'Relatórios',
      description: 'Acompanhe resultados da operação',
    },
  ];

  const routeSectionsByRole: Record<string, Array<{ title: string; routes: string[] }>> = {
    admin: [
      { title: 'Gestão e acompanhamento', routes: ['Vendas', 'Relatorios', 'Funcionarios'] },
      { title: 'Operação e cadastros', routes: ['Orcamentos', 'Produtos', 'Clientes', 'Fornecedores'] },
    ],
    gestor: [
      { title: 'Operação do negócio', routes: ['Vendas', 'Orcamentos', 'Produtos', 'Clientes'] },
      { title: 'Equipe e resultados', routes: ['Funcionarios', 'Fornecedores', 'Relatorios'] },
    ],
    funcionario: [
      { title: 'Vendas e atendimento', routes: ['Vendas', 'Clientes', 'Produtos'] },
      { title: 'Orçamentos e acompanhamento', routes: ['Orcamentos', 'Relatorios'] },
    ],
    cliente: [
      { title: 'Consultas disponíveis', routes: ['Orcamentos', 'Vendas', 'Produtos', 'Clientes'] },
    ],
  };
  if (administradorGlobal) {
    routeSectionsByRole.admin = [{ title: 'Administração global', routes: ['Organizacoes'] }];
  }
  const routeSections = routeSectionsByRole[user?.role ?? ''] ?? [
    { title: 'Seus acessos', routes: quickActions.map((item) => item.route) },
  ];
  const routeActionsGrouped = new Set(routeSections.flatMap((section) => section.routes));
  const actionSections = routeSections.map((section) => ({
    ...section,
    actions: quickActions.filter((item) => section.routes.includes(item.route) && canAccessRoute(user, item.route)),
  })).filter((section) => section.actions.length > 0);
  const otherPermittedActions = quickActions.filter((item) => !routeActionsGrouped.has(item.route) && canAccessRoute(user, item.route));
  if (otherPermittedActions.length) actionSections.push({ title: 'Outros acessos liberados', routes: otherPermittedActions.map((item) => item.route), actions: otherPermittedActions });

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
              <Text style={[styles.welcomeEyebrow, { color: colors.primary }]}>VISÃO GERAL</Text>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>Olá, {(user?.nome ?? user?.name ?? 'bem-vindo').split(' ')[0]}</Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.muted }]}>Acesse os módulos e acompanhe os principais indicadores.</Text>
            </View>
            <View style={[styles.welcomeIcon, { backgroundColor: colors.elevated }]}>
              <MaterialCommunityIcons name="view-dashboard-outline" size={26} color={colors.primary} />
            </View>
          </View>

          {podeVender ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Vender. Abrir caixa para registrar uma venda"
              onPress={() => navigation.navigate('NovaVenda')}
              style={({ pressed }) => [styles.sellButton, { backgroundColor: isDark ? '#2563EB' : colors.primary, opacity: pressed ? 0.88 : 1 }]}
            >
              <MaterialCommunityIcons name="cart-outline" size={23} color="#fff" />
              <Text style={styles.sellButtonText}>Vender +</Text>
              <MaterialCommunityIcons name="arrow-right" size={19} color="#fff" />
            </Pressable>
          ) : null}

          <View style={styles.metricsHeader}>
            <View>
              <View style={styles.sectionHeading}>
                <MaterialCommunityIcons name="chart-box-outline" size={21} color={colors.primary} />
                <Text variant="titleMedium" style={[styles.sectionTitle, styles.metricsTitle, { color: colors.text }]}>Resumo do sistema</Text>
              </View>
              <Text style={[styles.metricsSubtitle, { color: colors.muted }]}>Totais disponíveis para seu perfil</Text>
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
              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border === '#ffffff' ? '#D8DEE8' : colors.border }]}>
                <View style={styles.metricCardTop}>
                  <View style={[styles.metricIcon, { backgroundColor: colors.elevated }]}>
                    <MaterialCommunityIcons name={item.icon} size={21} color={item.cores} />
                  </View>
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>{item.titulo}</Text>
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, { color: colors.text }]}>{item.valor == null ? '—' : item.formato === 'moeda' ? moeda(item.valor) : item.valor.toLocaleString('pt-BR')}</Text>
                <Text style={[styles.metricFootnote, { color: colors.muted }]}>{item.rodape ?? (resumo ? 'Registros no sistema' : 'Resumo indisponível')}</Text>
              </View>
            )}
          />

          {actionSections.map((section) => (
            <React.Fragment key={section.title}>
              <View style={styles.sectionHeading}>
                <MaterialCommunityIcons name="lightning-bolt-outline" size={21} color={colors.primary} />
                <Text
                  variant="titleMedium"
                  numberOfLines={2}
                  style={[styles.sectionTitle, styles.actionSectionTitle, { color: colors.text }]}
                >
                  {section.title}
                </Text>
              </View>
              <View style={styles.grid}>
                {section.actions.map((item) => (
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
            </React.Fragment>
          ))}

          <View style={styles.sectionHeading}>
            <MaterialCommunityIcons name="dots-horizontal-circle-outline" size={21} color={colors.primary} />
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>Outros recursos</Text>
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
  sellButton: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 2,
  },
  sellButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 4,
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 18,
  },
  actionSectionTitle: { flexShrink: 1 },
  metricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  metricsTitle: { marginTop: 0, marginBottom: 0 },
  metricsSubtitle: { fontSize: 14, lineHeight: 19, marginTop: 3 },
  metricsList: { gap: 12, paddingVertical: 4, paddingRight: 16 },
  metricCard: {
    width: 190,
    minHeight: 128,
    borderRadius: 13,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    elevation: 0,
  },
  metricCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { fontSize: 14, fontWeight: '700', flex: 1, lineHeight: 19 },
  metricValue: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  metricFootnote: { fontSize: 12, lineHeight: 16, marginTop: 1 },
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

import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Nav from '@components/utilities/Nav';
import { getMetricasGlobais, MetricasGlobais, OrganizacaoGlobalResumo } from '@api/apiAdministracaoGlobal';
import { RootStackParamList } from '@context/types';
import { useTheme } from '@context/ThemeContext';

type CardProps = { title: string; value: number; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; detail: string };
const Metric = ({ title, value, icon, color, detail }: CardProps) => {
  const { colors } = useTheme();
  return <View style={[styles.metric, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={styles.metricTop}><View style={[styles.metricIcon, { backgroundColor: `${color}18` }]}><MaterialCommunityIcons name={icon} size={21} color={color} /></View><Text style={[styles.metricValue, { color: colors.text }]}>{value.toLocaleString('pt-BR')}</Text></View>
    <Text style={[styles.metricTitle, { color: colors.text }]}>{title}</Text>
    <Text style={[styles.metricDetail, { color: colors.muted }]}>{detail}</Text>
  </View>;
};

const OrganizationRow = ({ item, maxUsers }: { item: OrganizacaoGlobalResumo; maxUsers: number }) => {
  const { colors } = useTheme();
  const width = maxUsers ? `${Math.max(5, item.users_count / maxUsers * 100)}%` as `${number}%` : '0%';
  return <View style={[styles.organization, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <View style={styles.orgTitleRow}>
      <View style={styles.orgCopy}><Text style={[styles.orgName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text><Text style={[styles.orgUsers, { color: colors.muted }]}>{item.users_count.toLocaleString('pt-BR')} usuários</Text></View>
      <View style={[styles.badge, { backgroundColor: item.active ? '#DCFCE7' : '#FEE2E2' }]}><Text style={{ color: item.active ? '#166534' : '#991B1B', fontSize: 10, fontWeight: '800' }}>{item.active ? 'ATIVA' : 'INATIVA'}</Text></View>
    </View>
    <View style={[styles.track, { backgroundColor: colors.elevated }]}><View style={[styles.progress, { width, backgroundColor: item.active ? colors.primary : colors.muted }]} /></View>
  </View>;
};

export default function AdministracaoGlobal() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const [metrics, setMetrics] = useState<MetricasGlobais | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setMetrics(await getMetricasGlobais()); setError(false); }
    catch { setError(true); Toast.show({ type: 'error', text1: 'Não foi possível carregar as métricas globais.' }); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const cards = useMemo(() => metrics ? [
    { title: 'Organizações ativas', value: metrics.organizations_active, icon: 'domain' as const, color: '#2563EB', detail: `${metrics.organizations_inactive} inativa(s)` },
    { title: 'Usuários ativos', value: metrics.users_active, icon: 'account-check-outline' as const, color: '#16845B', detail: 'Em organizações ativas' },
    { title: 'Gestores ativos', value: metrics.managers_active, icon: 'account-tie-outline' as const, color: '#7C3AED', detail: 'Em organizações ativas' },
    { title: 'Funcionários ativos', value: metrics.employees_active, icon: 'account-group-outline' as const, color: '#D97706', detail: 'Em organizações ativas' },
    { title: 'Usuários em organizações inativas', value: metrics.users_inactive, icon: 'account-off-outline' as const, color: '#DC2626', detail: 'Aguardam reativação da organização' },
    { title: 'Novas organizações no mês', value: metrics.organizations_created_this_month, icon: 'domain-plus' as const, color: '#0891B2', detail: `${metrics.organizations_total} no total` },
  ] : [], [metrics]);

  const sortedOrganizations = useMemo(() => [...(metrics?.organizations ?? [])].sort((a, b) => Number(b.active) - Number(a.active) || b.users_count - a.users_count), [metrics]);
  const maxUsers = Math.max(0, ...sortedOrganizations.map((item) => item.users_count));

  return <View style={[styles.container, { backgroundColor: colors.background }]}>
    <Nav title="Visão global" subtitle="Métricas e parâmetros do sistema" onBackPress={() => navigation.goBack()} rightType="menu" />
    {loading && !metrics ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.muted, marginTop: 12 }}>Carregando indicadores...</Text></View> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.intro, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.introIcon, { backgroundColor: `${colors.primary}18` }]}><MaterialCommunityIcons name="view-dashboard-outline" size={25} color={colors.primary} /></View>
        <View style={styles.introCopy}><Text style={[styles.introTitle, { color: colors.text }]}>Administração do Gestorize</Text><Text style={[styles.caption, { color: colors.muted }]}>Acompanhe o crescimento e a situação das organizações em um painel consolidado.</Text></View>
      </View>
      {error && !metrics ? <Text style={[styles.empty, { color: colors.muted }]}>Os indicadores não estão disponíveis no momento. Deslize para atualizar.</Text> : null}
      <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: colors.text }]}>Indicadores principais</Text><Text style={[styles.caption, { color: colors.muted }]}>Visão atual</Text></View>
      <View style={styles.metricsGrid}>{cards.map((card) => <Metric key={card.title} {...card} />)}</View>
      <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: colors.text }]}>Organizações</Text><Text style={[styles.caption, { color: colors.muted }]}>{metrics?.organizations_total ?? 0} cadastradas</Text></View>
      {sortedOrganizations.length ? sortedOrganizations.map((item) => <OrganizationRow key={item.id} item={item} maxUsers={maxUsers} />) : <Text style={[styles.empty, { color: colors.muted }]}>Nenhuma organização cadastrada.</Text>}
      <Text style={[styles.note, { color: colors.muted }]}>“Usuários ativos” são as contas vinculadas a organizações ativas. O sistema ainda não possui ativação individual por usuário.</Text>
      <Text style={[styles.refresh, { color: colors.primary }]} onPress={() => void load()}>Atualizar indicadores</Text>
    </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 16, paddingBottom: 32, gap: 13 },
  intro: { borderWidth: 1, borderRadius: 17, padding: 15, flexDirection: 'row', gap: 12, alignItems: 'center' }, introIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, introCopy: { flex: 1, gap: 4 }, introTitle: { fontSize: 16, fontWeight: '800' }, caption: { fontSize: 12, lineHeight: 17 },
  sectionHeading: { marginTop: 8, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }, sectionTitle: { fontSize: 17, fontWeight: '800' }, metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, metric: { width: '47%', minHeight: 112, borderWidth: 1, borderRadius: 15, padding: 12, gap: 5 }, metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }, metricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, metricValue: { fontSize: 23, fontWeight: '900' }, metricTitle: { fontSize: 13, fontWeight: '800' }, metricDetail: { fontSize: 11, lineHeight: 15 },
  organization: { borderWidth: 1, borderRadius: 14, padding: 13, gap: 11 }, orgTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, orgCopy: { flex: 1 }, orgName: { fontSize: 14, fontWeight: '800' }, orgUsers: { fontSize: 12, marginTop: 3 }, badge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 }, track: { height: 6, borderRadius: 5, overflow: 'hidden' }, progress: { height: '100%', borderRadius: 5 }, note: { fontSize: 11, lineHeight: 16, marginTop: 2 }, refresh: { textAlign: 'center', fontWeight: '800', padding: 10 }, empty: { textAlign: 'center', padding: 20, fontSize: 13 },
});

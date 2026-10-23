import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Text, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Nav from '@components/utilities/Nav';
import { getVendas, VendaType } from '@api/apiVendas';
import { useTheme } from '@context/ThemeContext';
import { can } from '@utils/permissions';
import { useAuth } from '@context/AuthContext';

const moeda = (valor: number | string | null | undefined) => Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pagamentos: Record<string, string> = { pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito' };

export default function Vendas() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const podeVer = can(user, 'vendas.ver');
  const [vendas, setVendas] = useState<VendaType[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [abertaId, setAbertaId] = useState<string | undefined>();
  const [hoje, setHoje] = useState(() => new Date());

  useFocusEffect(useCallback(() => {
    let ativo = true;
    setHoje(new Date());
    setCarregando(true);
    if (!podeVer) {
      setVendas([]);
      setErro('Seu perfil não tem permissão para consultar as vendas.');
      setCarregando(false);
      return () => { ativo = false; };
    }
    getVendas().then((resposta) => {
      if (ativo) {
        const registros = (resposta.data ?? []).slice().sort((a, b) => new Date(b.vendido_em).getTime() - new Date(a.vendido_em).getTime());
        setVendas(registros);
        setErro('');
      }
    }).catch((error: any) => {
      if (ativo) setErro(error?.response?.data?.message ?? 'Não foi possível carregar o histórico de vendas.');
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [podeVer]));

  const vendasHoje = useMemo(() => vendas.filter((venda) => {
    const data = new Date(venda.vendido_em);
    return data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth() && data.getDate() === hoje.getDate();
  }), [vendas, hoje]);
  const faturamento = vendasHoje.reduce((total, venda) => total + Number(venda.valor_total), 0);
  const ticketMedio = vendasHoje.length ? faturamento / vendasHoje.length : 0;
  const operadores = new Set(vendasHoje.map((venda) => venda.vendedor?.trim() || 'Operador não informado')).size;
  const indicadores = [
    { label: 'Vendas hoje', value: String(vendasHoje.length), caption: 'Vendas concluídas hoje', icon: 'receipt-text-outline' as const },
    { label: 'Faturamento', value: moeda(faturamento), caption: 'Soma das vendas de hoje', icon: 'cash-multiple' as const },
    { label: 'Ticket médio', value: moeda(ticketMedio), caption: 'Valor médio por venda hoje', icon: 'chart-line' as const },
    { label: 'Operadores', value: String(operadores), caption: 'Com vendas registradas hoje', icon: 'account-tie-outline' as const },
  ];

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <Nav title="Vendas" subtitle="Acompanhamento, histórico e resultados" onBackPress={() => navigation.goBack()} rightType="menu" />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>ACOMPANHAMENTO</Text>
        <Text style={[styles.title, { color: colors.text }]}>Controle de vendas</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Resumo do dia e histórico das vendas registradas.</Text>
      </View>
      <View style={styles.metrics}>
        {indicadores.map((item) => <View key={item.label} style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.metricTop}><Text style={[styles.metricLabel, { color: colors.muted }]}>{item.label}</Text><View style={[styles.metricIcon, { backgroundColor: colors.elevated }]}><MaterialCommunityIcons name={item.icon} size={18} color={colors.primary} /></View></View>
          <Text numberOfLines={1} style={[styles.metricValue, { color: colors.text }]}>{carregando ? '—' : item.value}</Text>
          <Text style={[styles.metricCaption, { color: colors.muted }]}>{item.caption}</Text>
        </View>)}
      </View>
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.panelHeading}><View><Text style={[styles.heading, { color: colors.text }]}>Histórico de vendas</Text><Text style={[styles.subtitle, { color: colors.muted }]}>{vendas.length} registros</Text></View>{carregando ? <ActivityIndicator color={colors.primary} /> : null}</View>
        {erro ? <Text style={[styles.error, { color: colors.error }]}>{erro}</Text> : null}
        {!carregando && !erro && vendas.length === 0 ? <Text style={[styles.empty, { color: colors.muted }]}>Ainda não há vendas registradas.</Text> : null}
        {vendas.map((venda) => <List.Accordion
          key={venda.id}
          title={venda.cliente_nome || 'Venda sem cliente'}
          description={`${new Date(venda.vendido_em).toLocaleString('pt-BR')} · ${venda.itens?.length ?? 0} produto(s) · ${moeda(venda.valor_total)}`}
          expanded={abertaId === venda.id}
          onPress={() => setAbertaId((atual) => atual === venda.id ? undefined : venda.id)}
          titleStyle={[styles.saleTitle, { color: colors.text }]}
          descriptionStyle={{ color: colors.muted }}
          style={[styles.saleAccordion, { backgroundColor: colors.background, borderColor: colors.border }]}
          rippleColor={colors.border}
        >
          <View style={[styles.details, { borderColor: colors.border }]}>
            <Text style={[styles.detailText, { color: colors.muted }]}>Vendedor: {venda.vendedor || 'Equipe'}</Text>
            <Text style={[styles.detailText, { color: colors.muted }]}>Pagamento: {venda.forma_pagamento ? pagamentos[venda.forma_pagamento] : 'Não informado'}</Text>
            {Number(venda.desconto ?? 0) > 0 ? <Text style={[styles.detailText, { color: colors.muted }]}>Desconto: {moeda(venda.desconto)}</Text> : null}
            {venda.itens?.map((item) => <View key={item.id} style={[styles.itemRow, { borderColor: colors.border }]}><View style={styles.itemCopy}><Text style={[styles.itemName, { color: colors.text }]}>{item.produto_nome}</Text><Text style={[styles.detailText, { color: colors.muted }]}>{item.quantidade} × {moeda(item.preco_unitario)}</Text></View><Text style={[styles.itemTotal, { color: colors.text }]}>{moeda(item.subtotal)}</Text></View>)}
            <View style={styles.totalRow}><Text style={[styles.totalLabel, { color: colors.text }]}>Total da venda</Text><Text style={[styles.totalValue, { color: colors.primary }]}>{moeda(venda.valor_total)}</Text></View>
          </View>
        </List.Accordion>)}
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 16, paddingBottom: 36, gap: 14 }, intro: { gap: 4, marginBottom: 2 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1 }, title: { fontSize: 24, fontWeight: '900' }, subtitle: { fontSize: 12, lineHeight: 18 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, metricCard: { flexBasis: '47%', flexGrow: 1, minHeight: 112, padding: 13, borderWidth: 1, borderRadius: 14, justifyContent: 'space-between' },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 }, metricLabel: { fontSize: 11, fontWeight: '700', flex: 1 }, metricIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  metricValue: { fontSize: 19, fontWeight: '900' }, metricCaption: { fontSize: 10, lineHeight: 14 }, panel: { borderWidth: 1, borderRadius: 16, padding: 14 }, panelHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, heading: { fontSize: 17, fontWeight: '900' },
  empty: { paddingVertical: 18, fontSize: 13 }, error: { paddingVertical: 12, fontSize: 13 }, saleAccordion: { borderWidth: 1, borderRadius: 12, marginTop: 8, overflow: 'hidden' }, saleTitle: { fontWeight: '800' }, details: { padding: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 }, detailText: { fontSize: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth }, itemCopy: { flex: 1, gap: 3 }, itemName: { fontSize: 13, fontWeight: '700' }, itemTotal: { fontSize: 13, fontWeight: '800' }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }, totalLabel: { fontWeight: '800' }, totalValue: { fontSize: 17, fontWeight: '900' },
});

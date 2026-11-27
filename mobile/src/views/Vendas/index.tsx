import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text, List } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Nav from '@components/utilities/Nav';
import Button from '@components/botoes/Button';
import { estornarVenda, getMinhasVendas, getVendas, VendaType } from '@api/apiVendas';
import { useTheme } from '@context/ThemeContext';
import { can, canSell } from '@utils/permissions';
import { useAuth } from '@context/AuthContext';
import Toast from 'react-native-toast-message';
import * as Print from 'expo-print';
import { createSaleReceiptHtml, shareSaleReceipt } from '@utils/salesReceipt';

const moeda = (valor: number | string | null | undefined) => Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pagamentos: Record<string, string> = { pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito' };

export default function Vendas() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const podeVer = can(user, 'vendas.ver');
  const podeVender = canSell(user);
  const [vendas, setVendas] = useState<VendaType[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [abertaId, setAbertaId] = useState<string | undefined>();
  const [hoje, setHoje] = useState(() => new Date());
  const [estornandoId, setEstornandoId] = useState('');
  const [returnTarget, setReturnTarget] = useState<VendaType | null>(null);
  const [returnBadgeCode, setReturnBadgeCode] = useState('');
  const [returnPassword, setReturnPassword] = useState('');
  const [scannerVisivel, setScannerVisivel] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scanEmAndamento = useRef(false);
  const passwordInput = useRef<TextInput>(null);

  useFocusEffect(useCallback(() => {
    let ativo = true;
    setHoje(new Date());
    setCarregando(true);
    if (!podeVer && !podeVender) {
      setVendas([]);
      setErro('Seu perfil não tem permissão para consultar as vendas.');
      setCarregando(false);
      return () => { ativo = false; };
    }
    (podeVer ? getVendas() : getMinhasVendas()).then((resposta) => {
      if (ativo) {
        const registros = (resposta.data ?? [])
          .map((venda) => ({ venda, timestamp: Date.parse(venda.vendido_em) }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .map(({ venda }) => venda);
        setVendas(registros);
        setErro('');
      }
    }).catch((error: any) => {
      if (ativo) setErro(error?.response?.data?.message ?? 'Não foi possível carregar o histórico de vendas.');
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [podeVer, podeVender]));

  const vendasHoje = useMemo(() => vendas.filter((venda) => venda.status !== 'estornada' && (() => {
    const data = new Date(venda.vendido_em);
    return data.getFullYear() === hoje.getFullYear() && data.getMonth() === hoje.getMonth() && data.getDate() === hoje.getDate();
  })()), [vendas, hoje]);
  const faturamento = vendasHoje.reduce((total, venda) => total + Number(venda.valor_total), 0);
  const ticketMedio = vendasHoje.length ? faturamento / vendasHoje.length : 0;
  const operadores = new Set(vendasHoje.map((venda) => venda.vendedor?.trim() || 'Operador não informado')).size;
  const indicadores = [
    { label: 'Vendas hoje', value: String(vendasHoje.length), caption: 'Vendas concluídas hoje', icon: 'receipt-text-outline' as const },
    { label: 'Faturamento', value: moeda(faturamento), caption: 'Soma das vendas de hoje', icon: 'cash-multiple' as const },
    { label: 'Ticket médio', value: moeda(ticketMedio), caption: 'Valor médio por venda hoje', icon: 'chart-line' as const },
    { label: 'Operadores', value: String(operadores), caption: 'Com vendas registradas hoje', icon: 'account-tie-outline' as const },
  ];

  const imprimirComprovante = async (venda: VendaType) => {
    const logo = user?.organization?.settings?.logo_url ?? user?.organization?.settings?.logo;
    const html = createSaleReceiptHtml(venda, user?.organization?.name ?? user?.organization_name ?? 'Loja', typeof logo === 'string' ? logo : null);
    try { await Print.printAsync({ html }); }
    catch { Toast.show({ type: 'error', text1: 'Não foi possível abrir a impressão do comprovante.' }); }
  };

  const compartilharComprovante = async (venda: VendaType) => {
    const logo = user?.organization?.settings?.logo_url ?? user?.organization?.settings?.logo;
    const html = createSaleReceiptHtml(venda, user?.organization?.name ?? user?.organization_name ?? 'Loja', typeof logo === 'string' ? logo : null);
    try { await shareSaleReceipt(html, venda.id); }
    catch (error: any) {
      console.error('Erro ao compartilhar o comprovante da venda:', error);
      Toast.show({ type: 'error', text1: 'Não foi possível compartilhar o comprovante', text2: error?.message ?? 'Tente novamente.' });
    }
  };

  const pedirEstorno = (venda: VendaType) => {
    setReturnTarget(venda);
    setReturnBadgeCode('');
    setReturnPassword('');
  };

  const abrirScannerCracha = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Toast.show({ type: 'error', text1: 'A câmera não está autorizada.' });
        return;
      }
    }
    scanEmAndamento.current = false;
    setScannerVisivel(true);
  };

  const autorizarEstorno = async () => {
    const venda = returnTarget;
    if (!venda || estornandoId || !returnBadgeCode.trim() || !returnPassword) return;
    setEstornandoId(venda.id);
    try {
      await estornarVenda(venda.id, returnBadgeCode.trim(), returnPassword);
      Toast.show({ type: 'success', text1: 'Venda estornada', text2: 'Abrindo o caixa com os produtos no carrinho.' });
      setReturnTarget(null);
      setReturnPassword('');
      navigation.navigate('NovaVenda', { retomarVendaId: venda.id });
    } catch (error: any) {
      setReturnBadgeCode('');
      setReturnPassword('');
      Toast.show({ type: 'error', text1: 'Não foi possível estornar a venda', text2: error?.response?.data?.errors?.autorizador?.[0] ?? error?.response?.data?.message ?? 'Tente novamente.' });
    } finally { setEstornandoId(''); }
  };

  const renderVenda = ({ item: venda }: { item: VendaType }) => <List.Accordion
    key={venda.id}
    title={venda.cliente_nome || 'Venda sem cliente'}
    description={`${new Date(venda.vendido_em).toLocaleString('pt-BR')} · ${venda.itens?.length ?? 0} produto(s) · ${moeda(venda.valor_total)}`}
    expanded={abertaId === venda.id}
    onPress={() => setAbertaId((atual) => atual === venda.id ? undefined : venda.id)}
    titleStyle={[styles.saleTitle, { color: colors.text }]}
    descriptionStyle={[styles.saleDescription, { color: colors.muted }]}
    style={[styles.saleAccordion, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? '#ffffff' : '#000000', shadowOpacity: isDark ? 0.08 : 0.12 }]}
    left={({ style }) => <View style={[style, styles.saleIconCircle, { backgroundColor: isDark ? colors.elevated : 'rgba(6, 32, 70, 0.12)' }]}><MaterialCommunityIcons name="receipt-text-outline" size={26} color={isDark ? '#ffffff' : '#062046'} /></View>}
    right={({ isExpanded }) => <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={26} color={colors.primary} />}
    rippleColor={colors.border}
  >
    <View style={[styles.details, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {venda.status === 'estornada' ? <Text style={[styles.voidStatus, { color: colors.error }]}>Venda estornada{venda.estornada_em ? ` em ${new Date(venda.estornada_em).toLocaleString('pt-BR')}` : ''}{venda.estornada_por ? ` por ${venda.estornada_por}` : ''}{venda.estornada_autorizada_por ? ` · autorizada por ${venda.estornada_autorizada_por}` : ''}</Text> : null}
      <Text style={[styles.detailText, { color: colors.muted }]}>Vendedor: {venda.vendedor || 'Equipe'}</Text>
      <Text style={[styles.detailText, { color: colors.muted }]}>Pagamento: {venda.forma_pagamento ? pagamentos[venda.forma_pagamento] : 'Não informado'}</Text>
      {Number(venda.desconto ?? 0) > 0 ? <Text style={[styles.detailText, { color: colors.muted }]}>Desconto: {moeda(venda.desconto)}</Text> : null}
      {venda.itens?.map((item) => <View key={item.id} style={[styles.itemRow, { borderColor: colors.border }]}><View style={styles.itemCopy}><Text style={[styles.itemName, { color: colors.text }]}>{item.produto_nome}</Text><Text style={[styles.detailText, { color: colors.muted }]}>{item.quantidade} × {moeda(item.preco_unitario)}</Text></View><Text style={[styles.itemTotal, { color: colors.text }]}>{moeda(item.subtotal)}</Text></View>)}
      <View style={styles.totalRow}><Text style={[styles.totalLabel, { color: colors.text }]}>Total da venda</Text><Text style={[styles.totalValue, { color: colors.primary }]}>{moeda(venda.valor_total)}</Text></View>
      <View style={styles.historyActions}>
        <Button title="Imprimir comprovante" variant="outlined" onPress={() => void imprimirComprovante(venda)} />
        <Button title="Compartilhar comprovante" variant="outlined" onPress={() => void compartilharComprovante(venda)} />
        {podeVender && venda.status !== 'estornada' ? <Button title={estornandoId === venda.id ? 'Estornando...' : 'Retornar venda'} variant="outlined" color="secondary" disabled={Boolean(estornandoId)} onPress={() => pedirEstorno(venda)} /> : null}
      </View>
    </View>
  </List.Accordion>;

  const cabecalhoHistorico = <View style={styles.listHeader}>
    <View style={styles.intro}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>ACOMPANHAMENTO</Text>
      <Text style={[styles.title, { color: colors.text }]}>Controle de vendas</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{podeVer ? 'Resumo do dia e histórico das vendas registradas.' : 'Consulte suas vendas e solicite autorização para estorná-las.'}</Text>
    </View>
    <View style={styles.metrics}>
      {indicadores.map((item) => <View key={item.label} style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: isDark ? '#ffffff' : '#000000' }]}>
        <View style={styles.metricTop}><View style={[styles.metricIcon, { backgroundColor: `${colors.primary}20` }]}><MaterialCommunityIcons name={item.icon} size={19} color={colors.primary} /></View></View>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={[styles.metricValue, { color: colors.text }]}>{carregando ? '—' : item.value}</Text>
        <Text style={[styles.metricLabel, { color: colors.muted }]}>{item.label}</Text>
        <Text style={[styles.metricCaption, { color: colors.muted }]}>{item.caption}</Text>
      </View>)}
    </View>
    <View style={[styles.panelHeading, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View><Text style={[styles.heading, { color: colors.text }]}>{podeVer ? 'Histórico de vendas' : 'Minhas vendas'}</Text><Text style={[styles.subtitle, { color: colors.muted }]}>{vendas.length} registros</Text></View>
      {carregando ? <ActivityIndicator color={colors.primary} /> : null}
    </View>
    {erro ? <Text style={[styles.error, { color: colors.error }]}>{erro}</Text> : null}
  </View>;

  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <Nav title="Vendas" subtitle="Acompanhamento, histórico e resultados" onBackPress={() => navigation.goBack()} rightType="menu" />
    <FlatList
      data={vendas}
      keyExtractor={(venda) => venda.id}
      renderItem={renderVenda}
      ListHeaderComponent={cabecalhoHistorico}
      ListEmptyComponent={!carregando && !erro ? <Text style={[styles.empty, { color: colors.muted }]}>Ainda não há vendas registradas.</Text> : null}
      contentContainerStyle={styles.content}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      showsVerticalScrollIndicator={false}
    />
    <Modal visible={Boolean(returnTarget) && !scannerVisivel} transparent animationType="fade" onRequestClose={() => { if (!estornandoId) { setReturnTarget(null); setReturnBadgeCode(''); setReturnPassword(''); } }}>
      <View style={styles.dialogBackdrop}>
        <View style={[styles.authorizationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.authorizationTitle, { color: colors.text }]}>Autorização do gestor</Text>
          <Text style={[styles.authorizationDescription, { color: colors.muted }]}>Venda #{returnTarget?.id.slice(0, 8).toUpperCase()}: os itens voltarão ao estoque. Peça ao gestor para escanear o crachá e confirmar com a senha da própria conta.</Text>
          <TextInput value={returnBadgeCode} onChangeText={setReturnBadgeCode} onSubmitEditing={() => passwordInput.current?.focus()} returnKeyType="next" autoCapitalize="characters" autoCorrect={false} placeholder="Código do crachá do gestor" placeholderTextColor={colors.muted} style={[styles.authorizationInput, { color: colors.text, borderColor: colors.border }]} />
          <TouchableOpacity style={[styles.scanBadgeButton, { borderColor: colors.primary }]} onPress={() => void abrirScannerCracha()}>
            <MaterialCommunityIcons name="barcode-scan" size={19} color={colors.primary} />
            <Text style={[styles.scanBadgeText, { color: colors.primary }]}>Ler crachá com a câmera</Text>
          </TouchableOpacity>
          <TextInput ref={passwordInput} value={returnPassword} onChangeText={setReturnPassword} onSubmitEditing={() => void autorizarEstorno()} returnKeyType="done" secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Senha do gestor" placeholderTextColor={colors.muted} style={[styles.authorizationInput, { color: colors.text, borderColor: colors.border }]} />
          <Button title="Cancelar" variant="outlined" disabled={Boolean(estornandoId)} onPress={() => { setReturnTarget(null); setReturnBadgeCode(''); setReturnPassword(''); }} />
          <Button title={estornandoId ? 'Validando…' : 'Autorizar estorno'} disabled={Boolean(estornandoId) || !returnBadgeCode.trim() || !returnPassword} onPress={() => void autorizarEstorno()} />
        </View>
      </View>
    </Modal>
    <Modal visible={scannerVisivel} animationType="slide" onRequestClose={() => setScannerVisivel(false)}>
      <View style={styles.cameraScreen}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['code39'] }}
          onBarcodeScanned={({ data }) => {
            if (scanEmAndamento.current) return;
            scanEmAndamento.current = true;
            setReturnBadgeCode(data.trim());
            setScannerVisivel(false);
          }}
        />
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraTitle}>Aponte para o código do crachá do gestor</Text>
          <View style={styles.scanFrame} />
          <Button title="Cancelar leitura" variant="outlined" onPress={() => setScannerVisivel(false)} />
        </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 18, paddingBottom: 40, gap: 12 }, listHeader: { gap: 16, marginBottom: 4 }, intro: { gap: 6, marginBottom: 3 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.1 }, title: { fontSize: 28, lineHeight: 34, fontWeight: '900' }, subtitle: { fontSize: 14, lineHeight: 21 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metricCard: { flex: 1, flexBasis: '46%', maxWidth: '49%', minWidth: '45%', minHeight: 118, padding: 12, borderRadius: 14, borderWidth: 1, justifyContent: 'space-between', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  metricTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 }, metricLabel: { fontSize: 12, lineHeight: 15, fontWeight: '600' }, metricIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 22, fontWeight: 'bold', marginBottom: 3 }, metricCaption: { fontSize: 10, lineHeight: 14, fontWeight: '700' }, panelHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 15 }, heading: { fontSize: 20, fontWeight: '900' },
  empty: { paddingVertical: 20, paddingHorizontal: 4, fontSize: 16 }, error: { paddingVertical: 14, fontSize: 16 }, saleAccordion: { borderWidth: 1, borderRadius: 18, marginBottom: 11, paddingVertical: 8, paddingHorizontal: 8, overflow: 'hidden', shadowRadius: 10, elevation: 3 }, saleIconCircle: { width: 54, height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, saleTitle: { fontSize: 16, lineHeight: 21, fontWeight: '800' }, saleDescription: { fontSize: 12, lineHeight: 18 }, details: { padding: 15, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 }, detailText: { fontSize: 16, lineHeight: 23 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth }, itemCopy: { flex: 1, gap: 4 }, itemName: { fontSize: 17, lineHeight: 23, fontWeight: '700' }, itemTotal: { fontSize: 16, fontWeight: '800' }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }, totalLabel: { fontSize: 16, fontWeight: '800' }, totalValue: { fontSize: 21, fontWeight: '900' }, historyActions: { gap: 8, marginTop: 8 }, voidStatus: { fontSize: 14, fontWeight: '900' },
  dialogBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0009' }, authorizationCard: { gap: 13, padding: 20, borderRadius: 18, borderWidth: 1 }, authorizationTitle: { fontSize: 20, fontWeight: '900' }, authorizationDescription: { fontSize: 13, lineHeight: 19 }, authorizationInput: { minHeight: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, fontSize: 15 }, scanBadgeButton: { minHeight: 44, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, scanBadgeText: { fontSize: 14, fontWeight: '800' }, cameraScreen: { flex: 1, backgroundColor: '#000' }, cameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'space-around', padding: 28 }, cameraTitle: { color: '#fff', fontWeight: '800', fontSize: 18, textAlign: 'center', backgroundColor: '#0009', padding: 12, borderRadius: 12 }, scanFrame: { width: '88%', height: 180, borderWidth: 3, borderColor: '#FACC15', borderRadius: 20 },
});

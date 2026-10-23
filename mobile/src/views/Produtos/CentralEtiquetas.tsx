import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Print from 'expo-print';
import Toast from 'react-native-toast-message';
import Nav from '@components/utilities/Nav';
import SearchBar from '@components/ui/SearchBar';
import TooltipChip from '@components/botoes/TooltipChip';
import Button from '@components/botoes/Button';
import { useTheme } from '@context/ThemeContext';
import { ProdutoType, RootStackParamList } from '@context/types';
import { cancelarOperacaoEtiquetas, concluirOperacaoEtiquetas, criarOperacaoEtiquetas, EtiquetaOperation, EtiquetaOperationType, getHistoricoEtiquetas, getProdutosEtiquetas } from '@api/apiProdutos';
import { ALTURA_ETIQUETA_PONTOS, etiquetasProdutosHtml, LARGURA_ETIQUETA_PONTOS } from '@utils/codigoBarras';
import { formatErrorMessage } from '@core/utils/format';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Filtro = 'todos' | 'pendente' | 'impresso';

export default function CentralEtiquetas() {
  const navigation = useNavigation<Navigation>();
  const { colors, isDark } = useTheme();
  const pendingColor = isDark ? '#fbbf24' : '#b45309';
  const [produtos, setProdutos] = useState<ProdutoType[]>([]);
  const [historico, setHistorico] = useState<EtiquetaOperation[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [aba, setAba] = useState<'produtos' | 'historico'>('produtos');
  const [pesquisa, setPesquisa] = useState('');
  const [selecionados, setSelecionados] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [operando, setOperando] = useState(false);
  const operacaoEmAndamento = useRef(false);

  const carregarDados = useCallback(async () => {
    try {
      const [produtosResponse, historicoResponse] = await Promise.all([getProdutosEtiquetas(), getHistoricoEtiquetas()]);
      setProdutos(produtosResponse.data);
      setHistorico(historicoResponse.data);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar etiquetas', text2: formatErrorMessage(error, 'Tente novamente.') });
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void carregarDados(); }, [carregarDados]));

  const pendentes = useMemo(() => produtos.filter((produto) => produto.etiqueta_status !== 'impresso'), [produtos]);
  const impressos = useMemo(() => produtos.filter((produto) => produto.etiqueta_status === 'impresso'), [produtos]);
  const filtrados = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase();
    return produtos.filter((produto) => {
      const statusOk = filtro === 'todos' || (filtro === 'pendente' ? produto.etiqueta_status !== 'impresso' : produto.etiqueta_status === 'impresso');
      const buscaOk = !termo || produto.nome.toLocaleLowerCase().includes(termo)
        || (produto.codigo_barras ?? '').toLocaleLowerCase().includes(termo)
        || produto.id.toLocaleLowerCase().includes(termo);
      return statusOk && buscaOk;
    });
  }, [filtro, pesquisa, produtos]);
  const quantidadeProdutosSelecionados = Object.keys(selecionados).length;
  const totalEtiquetasSelecionadas = Object.values(selecionados).reduce((soma, quantidade) => soma + quantidade, 0);
  const selecionadosVisiveis = filtrados.length > 0 && filtrados.every((produto) => selecionados[produto.id]);

  const selecionarTodosVisiveis = () => {
    if (operacaoEmAndamento.current) return;
    setSelecionados((atuais) => {
      const novos = { ...atuais };
      if (selecionadosVisiveis) filtrados.forEach((produto) => { delete novos[produto.id]; });
      else filtrados.forEach((produto) => { novos[produto.id] ??= 1; });
      return novos;
    });
  };

  const ajustarSelecao = (id: string, delta: number) => {
    if (operacaoEmAndamento.current) return;
    setSelecionados((atuais) => {
      const novos = { ...atuais };
      const quantidade = Math.min(50, (novos[id] ?? 0) + delta);
      if (quantidade <= 0) delete novos[id];
      else novos[id] = quantidade;
      return novos;
    });
  };

  const registrarResultado = async (operation: EtiquetaOperation, concluida: boolean) => {
    try {
      if (concluida) {
        await concluirOperacaoEtiquetas(operation.id);
        Toast.show({ type: 'success', text1: 'Impressão registrada', text2: 'As etiquetas foram marcadas conforme sua confirmação.' });
      } else {
        await cancelarOperacaoEtiquetas(operation.id);
        Toast.show({ type: 'info', text1: 'Operação cancelada', text2: 'Os produtos continuam pendentes quando aplicável.' });
      }
      setSelecionados({});
      await carregarDados();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Não foi possível atualizar o histórico', text2: formatErrorMessage(error, 'A operação seguirá aguardando confirmação.') });
    }
  };

  const gerar = async (tipo: EtiquetaOperationType, idsQuantidade: Record<string, number> = {}) => {
    if (operacaoEmAndamento.current) return;
    if (tipo === 'pendentes' && pendentes.length === 0) {
      Toast.show({ type: 'info', text1: 'Nenhuma etiqueta pendente', text2: 'Todos os produtos estão atualizados.' });
      return;
    }
    if (tipo === 'todos') {
      const total = produtos.length;
      Alert.alert('Imprimir todas as etiquetas?', `${total} produtos e ${total} etiquetas. A operação pode demorar; confirme o resultado depois que o diálogo nativo de impressão fechar.`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: () => { void iniciarOperacao(tipo, idsQuantidade); } },
      ]);
      return;
    }
    await iniciarOperacao(tipo, idsQuantidade);
  };

  const iniciarOperacao = async (tipo: EtiquetaOperationType, idsQuantidade: Record<string, number>) => {
    if (operacaoEmAndamento.current) return;
    operacaoEmAndamento.current = true;
    setOperando(true);
    let operation: EtiquetaOperation | null = null;
    try {
      const itens = Object.entries(idsQuantidade).map(([produto_id, quantidade]) => ({ produto_id, quantidade }));
      const totalEtiquetas = tipo === 'selecionados' || tipo === 'reimpressao'
        ? itens.reduce((total, item) => total + item.quantidade, 0)
        : tipo === 'pendentes'
          ? pendentes.length
          : produtos.length;
      if (totalEtiquetas > 5000) {
        Toast.show({ type: 'error', text1: 'Seleção muito grande', text2: 'Gere até 5.000 etiquetas por operação.' });
        return;
      }
      const response = await criarOperacaoEtiquetas(tipo, itens);
      operation = response.data;
      const etiquetas = operation.itens.map((item) => ({
        produto: {
          nome: item.produto_nome,
          codigo_barras: item.codigo_barras,
          categoria_titulo: item.categoria_nome,
          fornecedor_razao_social: item.fornecedor_nome,
          unidade_medida_sigla: item.unidade_sigla,
          preco_venda: item.preco_venda,
        },
        quantidade: Number(item.quantidade),
      }));
      await Print.printAsync({
        html: etiquetasProdutosHtml(etiquetas),
        width: LARGURA_ETIQUETA_PONTOS,
        height: ALTURA_ETIQUETA_PONTOS,
      });
      setAba('historico');
      await carregarDados();
      Toast.show({
        type: 'info',
        text1: 'Impressão aberta',
        text2: 'Após fechar o diálogo de impressão, confirme o resultado no histórico.',
      });
    } catch (error) {
      if (operation) {
        try { await cancelarOperacaoEtiquetas(operation.id); } catch { /* a operação ficará aguardando confirmação no histórico */ }
      }
      Toast.show({ type: 'error', text1: 'Não foi possível gerar as etiquetas', text2: formatErrorMessage(error, 'Tente novamente.') });
      await carregarDados();
    } finally {
      operacaoEmAndamento.current = false;
      setOperando(false);
    }
  };

  const mudarStatusHistorico = async (operacao: EtiquetaOperation, concluir: boolean) => {
    if (operacaoEmAndamento.current) return;
    await registrarResultado(operacao, concluir);
  };

  const renderProduto = ({ item }: { item: ProdutoType }) => {
    const selecionado = Boolean(selecionados[item.id]);
    const impresso = item.etiqueta_status === 'impresso';
    return <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: selecionado ? colors.primary : colors.border, shadowColor: colors.text, borderWidth: selecionado ? 2 : 1 }]}>
      <View style={[styles.productIcon, { backgroundColor: colors.elevated }]}>
        <MaterialCommunityIcons name="package-variant" size={27} color={colors.primary} />
      </View>
      <View style={styles.productInfo}>
        {item.categoria_titulo ? <View style={styles.categoryLine}><Ionicons name="pricetag-outline" size={12} color={colors.primary} /><Text numberOfLines={1} style={[styles.categoryText, { color: colors.primary }]}>{item.categoria_titulo}</Text></View> : null}
        <Text numberOfLines={2} style={[styles.productName, { color: colors.text }]}>{item.nome}</Text>
        <View style={styles.codeLine}><MaterialCommunityIcons name="barcode" size={15} color={colors.muted} /><Text numberOfLines={1} style={[styles.productCode, { color: colors.muted }]}>{item.codigo_barras || `ID ${item.id.slice(0, 8)}`}</Text></View>
        <View style={[styles.statusPill, { backgroundColor: impresso ? `${colors.success}20` : `${pendingColor}20` }]}>
          <Text style={{ color: impresso ? colors.success : pendingColor, fontSize: 11, fontWeight: '700' }}>{impresso ? 'Impresso' : 'Pendente'}</Text>
        </View>
      </View>
      <View style={styles.productControls}>
        <Pressable disabled={operando} accessibilityRole="checkbox" accessibilityState={{ checked: selecionado, disabled: operando }} accessibilityLabel={`${selecionado ? 'Remover' : 'Selecionar'} ${item.nome}`} onPress={() => ajustarSelecao(item.id, selecionado ? -(selecionados[item.id] ?? 1) : 1)} style={styles.checkbox}>
          <Ionicons name={selecionado ? 'checkbox' : 'square-outline'} size={23} color={selecionado ? colors.primary : colors.muted} />
        </Pressable>
      {selecionado ? <View style={styles.stepper}>
        <TouchableOpacity disabled={operando} accessibilityLabel="Diminuir etiquetas" onPress={() => ajustarSelecao(item.id, -1)} style={[styles.stepButton, { borderColor: colors.border, opacity: operando ? 0.5 : 1 }]}><MaterialCommunityIcons name="minus" size={18} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.stepValue, { color: colors.text }]}>{selecionados[item.id]}</Text>
        <TouchableOpacity accessibilityLabel="Aumentar etiquetas" disabled={operando || selecionados[item.id] >= 50} onPress={() => ajustarSelecao(item.id, 1)} style={[styles.stepButton, { backgroundColor: `${colors.primary}18`, borderColor: colors.primary, opacity: operando || selecionados[item.id] >= 50 ? 0.5 : 1 }]}><MaterialCommunityIcons name="plus" size={18} color={colors.primary} /></TouchableOpacity>
      </View> : null}
      </View>
    </View>;
  };

  const renderHistorico = ({ item }: { item: EtiquetaOperation }) => <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.text }]}>
    <View style={styles.historyHead}>
      <View style={[styles.historyIcon, { backgroundColor: colors.elevated }]}><MaterialCommunityIcons name="printer-outline" size={21} color={colors.primary} /></View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.productName, { color: colors.text }]}>{item.tipo === 'todos' ? 'Impressão global' : item.tipo === 'pendentes' ? 'Impressão de pendentes' : item.tipo === 'reimpressao' ? 'Reimpressão individual' : 'Produtos selecionados'}</Text>
        <Text style={[styles.productCode, { color: colors.muted }]}>{new Date(item.created_at).toLocaleString('pt-BR')}</Text>
      </View>
      <View style={[styles.historyStatus, { backgroundColor: item.status === 'concluida' ? `${colors.success}20` : item.status === 'aguardando_confirmacao' ? `${pendingColor}20` : `${colors.muted}20` }]}>
        <Text style={{ color: item.status === 'concluida' ? colors.success : item.status === 'aguardando_confirmacao' ? pendingColor : colors.muted, fontSize: 10, fontWeight: '800' }}>{item.status.replaceAll('_', ' ')}</Text>
      </View>
    </View>
    <Text style={[styles.historyMeta, { color: colors.muted }]}>{item.usuario_nome ?? 'Usuário'} · {item.total_produtos} produto(s) · {item.total_etiquetas} etiqueta(s)</Text>
    <View style={[styles.historyItemsBox, { backgroundColor: colors.surface }]}><Text style={[styles.historyItems, { color: colors.text }]} numberOfLines={3}>{item.itens.map((produto) => `${produto.produto_nome} × ${produto.quantidade}`).join(' · ')}</Text></View>
    {item.status === 'aguardando_confirmacao' ? <View style={styles.historyActions}>
      <TooltipChip label="Marcar cancelada" disabled={operando} onPress={() => void mudarStatusHistorico(item, false)} />
      <TooltipChip label="Confirmar impressão" active disabled={operando} onPress={() => void mudarStatusHistorico(item, true)} />
    </View> : null}
  </View>;

  return <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
    <Nav title="Etiquetas" subtitle="Central de impressão" onBackPress={() => navigation.goBack()} rightType="menu" />
    <View style={styles.topActions}>
      <TooltipChip label="Etiquetas" active={aba === 'produtos'} onPress={() => setAba('produtos')} />
      <TooltipChip label="Histórico" active={aba === 'historico'} onPress={() => setAba('historico')} />
    </View>

    {aba === 'produtos' ? <>
      <View style={styles.summaryRow}>
        {[{ label: 'Pendentes', value: pendentes.length, color: pendingColor }, { label: 'Impressos', value: impressos.length, color: colors.success }, { label: 'Selecionados', value: totalEtiquetasSelecionadas, color: colors.primary }].map((item) => <View key={item.label} style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text><Text numberOfLines={1} style={[styles.summaryLabel, { color: colors.muted }]}>{item.label}</Text></View>)}
      </View>
      <SearchBar
        value={pesquisa}
        onChangeText={setPesquisa}
        placeholder="Produto, código de barras ou ID"
        rightElement={pesquisa ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setPesquisa('')}><MaterialCommunityIcons name="close-circle" size={18} color={colors.muted} /></TouchableOpacity> : null}
      />
      <View style={styles.filterRow}>
        {([{ key: 'todos', label: `Todos (${produtos.length})` }, { key: 'pendente', label: `Pendentes (${pendentes.length})` }, { key: 'impresso', label: `Impressos (${impressos.length})` }] as const).map((item) => <TooltipChip key={item.key} label={item.label} active={filtro === item.key} onPress={() => setFiltro(item.key)} />)}
      </View>
      <View style={styles.selectRow}>
        <TouchableOpacity onPress={selecionarTodosVisiveis} disabled={filtrados.length === 0} style={[styles.selectAll, { backgroundColor: colors.elevated, borderColor: colors.border, opacity: filtrados.length === 0 ? 0.5 : 1 }]}>
          <Ionicons name={selecionadosVisiveis ? 'checkbox' : 'square-outline'} size={22} color={colors.primary} />
          <Text style={[styles.selectText, { color: colors.text }]}>{selecionadosVisiveis ? 'Desmarcar produtos exibidos' : 'Selecionar produtos exibidos'}</Text>
          <Text style={[styles.clearText, { color: colors.muted }]}>{filtrados.length}</Text>
        </TouchableOpacity>
        {quantidadeProdutosSelecionados > 0 ? <TouchableOpacity disabled={operando} onPress={() => setSelecionados({})} style={styles.clearAll}><Text style={[styles.clearAllText, { color: colors.primary }]}>Limpar</Text></TouchableOpacity> : null}
      </View>
      {carregando ? <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} /> : filtrados.length === 0 ? <View style={styles.empty}><MaterialCommunityIcons name="tag-off-outline" size={36} color={colors.muted} /><Text style={[styles.emptyText, { color: colors.muted }]}>{produtos.length ? 'Nenhum produto corresponde a esta pesquisa.' : 'Nenhum produto cadastrado.'}</Text></View> : <FlatList data={filtrados} keyExtractor={(item) => item.id} renderItem={renderProduto} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} onRefresh={() => { setCarregando(true); void carregarDados(); }} refreshing={carregando} />}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={styles.secondaryActions}>
          <TooltipChip label={`Pendentes (${pendentes.length})`} disabled={operando || pendentes.length === 0} onPress={() => void gerar('pendentes')} />
          <TooltipChip label={`Todas (${produtos.length})`} disabled={operando || produtos.length === 0} onPress={() => void gerar('todos')} />
        </View>
        <Button
          title={operando ? 'Preparando impressão...' : 'Gerar impressão'}
          variant="contained"
          color="primary"
          onPress={() => void gerar('selecionados', selecionados)}
          disabled={operando || quantidadeProdutosSelecionados === 0}
        />
      </View>
    </> : carregando ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} /> : historico.length === 0 ? <View style={styles.empty}><MaterialCommunityIcons name="history" size={36} color={colors.muted} /><Text style={[styles.emptyText, { color: colors.muted }]}>Ainda não há operações de impressão.</Text></View> : <FlatList data={historico} keyExtractor={(item) => item.id} renderItem={renderHistorico} contentContainerStyle={[styles.list, { paddingBottom: 30 }]} showsVerticalScrollIndicator={false} onRefresh={() => { setCarregando(true); void carregarDados(); }} refreshing={carregando} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, topActions: { flexDirection: 'row', gap: 9, paddingHorizontal: 14, paddingVertical: 10 },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 8 }, summaryCard: { flex: 1, minHeight: 62, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 4 }, summaryValue: { fontSize: 20, fontWeight: '900' }, summaryLabel: { marginTop: 2, fontSize: 10, fontWeight: '600' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingVertical: 4 },
  selectRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }, selectAll: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, borderWidth: 1, borderRadius: 12 }, selectText: { flex: 1, fontSize: 12, fontWeight: '700' }, clearText: { fontSize: 11, fontWeight: '600' }, clearAll: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 8 }, clearAllText: { fontSize: 12, fontWeight: '700' }, list: { paddingHorizontal: 11, paddingBottom: 10, gap: 8 },
  productCard: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, elevation: 1, shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, productIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15 }, checkbox: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' }, productControls: { alignItems: 'center', justifyContent: 'center', gap: 5 }, productInfo: { flex: 1, minWidth: 0, gap: 3 }, categoryLine: { flexDirection: 'row', alignItems: 'center', gap: 4 }, categoryText: { fontSize: 11, fontWeight: '700', flexShrink: 1 }, codeLine: { flexDirection: 'row', alignItems: 'center', gap: 4 }, productName: { fontSize: 14, fontWeight: '800' }, productCode: { fontSize: 11, flexShrink: 1 }, statusPill: { alignSelf: 'flex-start', marginTop: 3, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }, stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 }, stepButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 10 }, stepValue: { minWidth: 18, textAlign: 'center', fontSize: 14, fontWeight: '800' },
  footer: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 5, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 }, secondaryActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25, gap: 10 }, emptyText: { textAlign: 'center', fontSize: 14 }, historyCard: { padding: 14, borderWidth: 1, borderRadius: 16, gap: 9, elevation: 1, shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, historyHead: { flexDirection: 'row', alignItems: 'center', gap: 9 }, historyIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13 }, historyStatus: { maxWidth: 125, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, alignSelf: 'flex-start' }, historyMeta: { fontSize: 11 }, historyItemsBox: { borderRadius: 11, padding: 10 }, historyItems: { fontSize: 12, lineHeight: 17 }, historyActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 },
});

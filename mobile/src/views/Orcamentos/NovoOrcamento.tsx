import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import Button from '@components/botoes/Button';
import DateField from '@components/DateField';
import DialogConfirmarAcao from '@components/dialogs/DialogConfirmarAcao';
import EditableTextCard from '@components/EditableTextCard';
import Nav from '@components/utilities/Nav';
import Selector from '@components/Selector';
import { getClientes } from '@api/apiClientes';
import {
  createOrcamento,
  deleteOrcamento,
  getOrcamento,
  OrcamentoItemPayload,
  updateOrcamento,
} from '@api/apiOrcamentos';
import { getProdutos } from '@api/apiProdutos';
import { dateFromApi, dateToApi, formatMoney } from '@core/utils/format';
import {
  ClienteType,
  OrcamentoItemType,
  ProdutoType,
  RootStackParamList,
} from '@context/types';
import { useTheme } from '@context/ThemeContext';
import Toast from 'react-native-toast-message';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = NativeStackScreenProps<RootStackParamList, 'NovoOrcamento'>['route'];
type ItemForm = {
  key: string;
  produto_id: string;
  quantidade: string;
  preco_unitario: string;
};

const dataHoje = () => {
  const hoje = new Date();
  return `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
};

const parseMoney = (value: string) => {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return Number(normalized);
};

const novoItem = (): ItemForm => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  produto_id: '',
  quantidade: '1',
  preco_unitario: '',
});

const formatarItens = (itens: OrcamentoItemType[]): ItemForm[] =>
  itens.map((item) => ({
    key: item.id,
    produto_id: item.produto_id,
    quantidade: String(item.quantidade),
    preco_unitario: formatMoney(item.preco_unitario),
  }));

export default function NovoOrcamento() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const modo = route.params?.modo ?? 'criar';
  const orcamentoId = route.params?.orcamentoId;
  const editando = modo === 'editar';

  const [clientes, setClientes] = useState<ClienteType[]>([]);
  const [produtos, setProdutos] = useState<ProdutoType[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [data, setData] = useState(dataHoje());
  const [itens, setItens] = useState<ItemForm[]>([novoItem()]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const opcoesClientes = useMemo(
    () => clientes.map((cliente) => ({ id: cliente.id, nome: cliente.nome })),
    [clientes],
  );

  const valorTotal = useMemo(
    () => itens.reduce((total, item) => {
      const quantidade = Number(item.quantidade);
      const preco = parseMoney(item.preco_unitario);
      return total + (Number.isFinite(quantidade) && Number.isFinite(preco) ? quantidade * preco : 0);
    }, 0),
    [itens],
  );

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const [clientesResponse, produtosResponse] = await Promise.all([
        getClientes(),
        getProdutos(),
      ]);
      const clientesCarregados = clientesResponse.data ?? [];
      const produtosCarregados = produtosResponse.data ?? [];
      setClientes(clientesCarregados);
      setProdutos(produtosCarregados);

      if (editando && orcamentoId) {
        const response = await getOrcamento(orcamentoId);
        const orcamento = response.data;
        setClienteId(orcamento.cliente_id);
        setData(dateFromApi(orcamento.data_orcamento) ?? dataHoje());

        const produtosDisponiveis = [...produtosCarregados];
        const itensDoOrcamento = (orcamento.itens ?? []).map((item) => {
          if (item.produto && !produtosDisponiveis.some((produto) => produto.id === item.produto_id)) {
            produtosDisponiveis.push(item.produto);
          }
          return item;
        });
        setProdutos(produtosDisponiveis);
        setItens(itensDoOrcamento.length ? formatarItens(itensDoOrcamento) : [novoItem()]);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar orçamento',
        text2: error?.response?.data?.message ?? 'Não foi possível carregar clientes e produtos.',
      });
      if (editando) navigation.goBack();
    } finally {
      setCarregando(false);
    }
  }, [editando, navigation, orcamentoId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const atualizarItem = (key: string, changes: Partial<ItemForm>) => {
    setItens((atuais) => atuais.map((item) => item.key === key ? { ...item, ...changes } : item));
  };

  const selecionarProduto = (key: string, produtoId: string) => {
    const produto = produtos.find((item) => item.id === produtoId);
    atualizarItem(key, {
      produto_id: produtoId,
      preco_unitario: formatMoney(produto?.preco_venda ?? 0),
    });
  };

  const opcoesDeProduto = (itemAtual: ItemForm) => {
    const idsSelecionados = new Set(
      itens.filter((item) => item.key !== itemAtual.key).map((item) => item.produto_id),
    );
    return produtos
      .filter((produto) => !idsSelecionados.has(produto.id))
      .map((produto) => ({ id: produto.id, nome: produto.nome }));
  };

  const montarPayload = (): { cliente_id: string; data_orcamento: string; itens: OrcamentoItemPayload[] } | null => {
    if (!clienteId) {
      Toast.show({ type: 'error', text1: 'Selecione um cliente' });
      return null;
    }

    let dataOrcamento: string | null;
    try {
      dataOrcamento = dateToApi(data);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Data inválida', text2: error.message });
      return null;
    }

    const itensPayload: OrcamentoItemPayload[] = [];
    for (const item of itens) {
      if (!item.produto_id) {
        Toast.show({ type: 'error', text1: 'Selecione um produto em cada item' });
        return null;
      }

      const quantidade = Number(item.quantidade);
      const preco = parseMoney(item.preco_unitario);
      if (!Number.isInteger(quantidade) || quantidade < 1 || !Number.isFinite(preco) || preco < 0) {
        Toast.show({ type: 'error', text1: 'Confira quantidade e preço dos produtos' });
        return null;
      }

      itensPayload.push({ produto_id: item.produto_id, quantidade, preco_unitario: preco });
    }

    return { cliente_id: clienteId, data_orcamento: dataOrcamento ?? '', itens: itensPayload };
  };

  const salvar = async () => {
    const payload = montarPayload();
    if (!payload) return;

    try {
      setSalvando(true);
      if (editando && orcamentoId) {
        await updateOrcamento(orcamentoId, payload);
      } else {
        await createOrcamento(payload);
      }
      Toast.show({ type: 'success', text1: editando ? 'Orçamento atualizado' : 'Orçamento criado' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Não foi possível salvar o orçamento',
        text2: error?.response?.data?.message ?? 'Verifique os dados e tente novamente.',
      });
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!orcamentoId) return;
    try {
      setSalvando(true);
      await deleteOrcamento(orcamentoId);
      Toast.show({ type: 'success', text1: 'Orçamento removido' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Não foi possível excluir', text2: error?.response?.data?.message });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Nav
        title={editando ? 'Editar orçamento' : 'Novo orçamento'}
        subtitle={editando ? 'Atualize os dados e produtos' : 'Selecione cliente e produtos'}
        onBackPress={() => navigation.goBack()}
        rightType="menu"
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Dados do orçamento</Text>
        <Selector
          label="Cliente"
          placeholder={carregando ? 'Carregando clientes...' : 'Selecione um cliente'}
          value={clienteId}
          options={opcoesClientes}
          loading={carregando}
          disabled={carregando || salvando}
          onChange={setClienteId}
        />
        <DateField label="Data do orçamento" value={data} onChange={setData} />

        <View style={styles.itemsHeader}>
          <Text style={styles.sectionTitle}>Produtos</Text>
          <Text style={styles.itemCount}>{itens.length} {itens.length === 1 ? 'item' : 'itens'}</Text>
        </View>

        {itens.map((item, index) => {
          const produto = produtos.find((opcao) => opcao.id === item.produto_id);
          return (
            <View key={item.key} style={styles.itemCard}>
              <View style={styles.itemTitleRow}>
                <Text style={styles.itemTitle}>Produto {index + 1}</Text>
                {itens.length > 1 && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Remover produto ${index + 1}`}
                    disabled={salvando}
                    onPress={() => setItens((atuais) => atuais.filter((atual) => atual.key !== item.key))}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#C62828" />
                  </TouchableOpacity>
                )}
              </View>

              <Selector
                label="Produto"
                placeholder={carregando ? 'Carregando produtos...' : 'Selecione um produto'}
                value={item.produto_id}
                options={opcoesDeProduto(item)}
                loading={carregando}
                disabled={carregando || salvando}
                onChange={(produtoId) => selecionarProduto(item.key, produtoId)}
              />

              {produto && (
                <Text style={styles.stockText}>
                  Estoque disponível: {Number(produto.estoque)} {produto.unidade_medida_sigla ?? 'un.'}
                </Text>
              )}

              <View style={styles.itemFields}>
                <EditableTextCard
                  label="Quantidade"
                  value={item.quantidade}
                  tipo="number"
                  placeholder="1"
                  editable={!salvando}
                  onChangeText={(quantidade) => atualizarItem(item.key, { quantidade })}
                  width="48%"
                />
                <EditableTextCard
                  label="Preço unitário"
                  value={item.preco_unitario}
                  tipo="number"
                  money
                  placeholder="0,00"
                  editable={!salvando}
                  onChangeText={(preco_unitario) => atualizarItem(item.key, { preco_unitario })}
                  width="48%"
                />
              </View>
              <Text style={styles.subtotal}>
                Subtotal: {formatMoney((Number(item.quantidade) || 0) * (parseMoney(item.preco_unitario) || 0))}
              </Text>
            </View>
          );
        })}

        <Button
          title="Adicionar produto"
          variant="outlined"
          disabled={carregando || salvando || produtos.length <= itens.filter((item) => item.produto_id).length}
          onPress={() => setItens((atuais) => [...atuais, novoItem()])}
        />

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total do orçamento</Text>
          <Text style={styles.totalValue}>{formatMoney(valorTotal)}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            title={salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar orçamento'}
            disabled={salvando || carregando || !itens.length || !produtos.length}
            onPress={salvar}
          />
          {editando && (
            <Button
              title="Excluir orçamento"
              variant="delete"
              disabled={salvando}
              onPress={() => setShowDeleteDialog(true)}
            />
          )}
        </View>
      </ScrollView>

      <DialogConfirmarAcao
        show={showDeleteDialog}
        setShow={setShowDeleteDialog}
        titulo="Tem certeza que deseja excluir este orçamento?"
        onSuccess={confirmarExclusao}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 36 },
  sectionTitle: { color: '#062046', fontSize: 18, fontWeight: '800' },
  itemsHeader: { marginTop: 18, marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemCount: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  itemCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#D5DCE5', padding: 14, marginBottom: 12 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle: { color: '#062046', fontSize: 16, fontWeight: '800' },
  removeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FDECEC' },
  stockText: { color: '#64748B', fontSize: 13, marginTop: -3 },
  itemFields: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  subtotal: { color: '#334155', fontSize: 15, fontWeight: '700', textAlign: 'right', marginTop: 2 },
  totalCard: { marginTop: 18, marginBottom: 16, backgroundColor: '#062046', borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: '#DCE8F8', fontSize: 15, fontWeight: '700' },
  totalValue: { color: '#fff', fontSize: 21, fontWeight: '900' },
  actions: { marginTop: 14, gap: 12 },
});

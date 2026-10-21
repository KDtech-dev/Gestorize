import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
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
import DialogConfirmarAcao from '@components/dialogs/DialogConfirmarAcao';
import EditableTextCard from '@components/EditableTextCard';
import Nav from '@components/utilities/Nav';
import Selector from '@components/Selector';
import TooltipChip from '@components/botoes/TooltipChip';
import SearchBar from '@components/ui/SearchBar';
import Produto from '@components/ui-lists/Produto';
import ClickableTextCard from '@components/ClickableTextCard';
import { getClientes } from '@api/apiClientes';
import {
  createOrcamento,
  deleteOrcamento,
  getOrcamento,
  OrcamentoItemPayload,
  updateOrcamento,
} from '@api/apiOrcamentos';
import { getProdutos } from '@api/apiProdutos';
import { formatMoney } from '@core/utils/format';
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
  preco_unitario: number;
};
type CategoriaFiltro = { id: string; label: string };

const novoItem = (produto: ProdutoType, item?: OrcamentoItemType): ItemForm => ({
  key: item?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  produto_id: produto.id,
  quantidade: String(item?.quantidade ?? 1),
  preco_unitario: Number(item?.preco_unitario ?? produto.preco_venda ?? 0),
});

const dataHora = (valor?: string) => {
  if (!valor) return 'Preenchida automaticamente ao salvar';
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

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
  const [titulo, setTitulo] = useState('');
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [criadoEm, setCriadoEm] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [modalProdutosVisivel, setModalProdutosVisivel] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const opcoesClientes = useMemo(
    () => clientes.map((cliente) => ({ id: cliente.id, nome: cliente.nome })),
    [clientes],
  );

  const categorias = useMemo<CategoriaFiltro[]>(() => {
    const categoriasUnicas = new Map<string, string>();
    produtos.forEach((produto) => {
      const id = produto.categoria_id || 'sem-categoria';
      const label = produto.categoria_titulo || 'Sem categoria';
      if (!categoriasUnicas.has(id)) categoriasUnicas.set(id, label);
    });
    return [...categoriasUnicas].map(([id, label]) => ({ id, label }));
  }, [produtos]);

  const produtosDisponiveis = useMemo(() => {
    const idsSelecionados = new Set(itens.map((item) => item.produto_id));
    const termo = buscaProduto.trim().toLocaleLowerCase('pt-BR');
    return produtos.filter((produto) => {
      const categoriaId = produto.categoria_id || 'sem-categoria';
      const correspondeCategoria = !categoriaSelecionada || categoriaSelecionada === categoriaId;
      const correspondeBusca = !termo || [
        produto.nome,
        produto.descricao ?? '',
        produto.categoria_titulo ?? '',
        produto.fornecedor_razao_social ?? '',
      ].some((campo) => campo.toLocaleLowerCase('pt-BR').includes(termo));
      return !idsSelecionados.has(produto.id) && correspondeCategoria && correspondeBusca;
    });
  }, [buscaProduto, categoriaSelecionada, itens, produtos]);

  const valorTotal = useMemo(
    () => itens.reduce((total, item) => total + Number(item.quantidade || 0) * item.preco_unitario, 0),
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
        setTitulo(orcamento.titulo ?? '');
        setCriadoEm(dataHora(orcamento.created_at));
        setAtualizadoEm(dataHora(orcamento.updated_at));

        const produtosComItens = [...produtosCarregados];
        const itensCarregados = (orcamento.itens ?? []).flatMap((item) => {
          let produto = produtosComItens.find((opcao) => opcao.id === item.produto_id);
          if (!produto && item.produto) {
            produto = item.produto;
            produtosComItens.push(produto);
          }
          return produto ? [novoItem(produto, item)] : [];
        });
        setProdutos(produtosComItens);
        setItens(itensCarregados);
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

  const escolherProduto = (produto: ProdutoType) => {
    setItens((atuais) => [...atuais, novoItem(produto)]);
    setModalProdutosVisivel(false);
    setBuscaProduto('');
    setCategoriaSelecionada(null);
  };

  const atualizarQuantidade = (key: string, quantidade: string) => {
    setItens((atuais) => atuais.map((item) => item.key === key ? { ...item, quantidade } : item));
  };

  const salvar = async () => {
    if (!titulo.trim()) {
      Toast.show({ type: 'error', text1: 'Informe um título para o orçamento' });
      return;
    }
    if (!clienteId) {
      Toast.show({ type: 'error', text1: 'Selecione um cliente' });
      return;
    }
    if (!itens.length) {
      Toast.show({ type: 'error', text1: 'Adicione pelo menos um produto' });
      return;
    }

    const itensPayload: OrcamentoItemPayload[] = [];
    for (const item of itens) {
      const quantidade = Number(item.quantidade);
      if (!Number.isInteger(quantidade) || quantidade < 1) {
        Toast.show({ type: 'error', text1: 'Informe quantidades inteiras maiores que zero' });
        return;
      }
      itensPayload.push({ produto_id: item.produto_id, quantidade });
    }

    const payload = { titulo: titulo.trim(), cliente_id: clienteId, itens: itensPayload };
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
        subtitle={editando ? 'Atualize os dados e produtos' : 'Identifique o orçamento e selecione os produtos'}
        onBackPress={() => navigation.goBack()}
        rightType="menu"
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Dados do orçamento</Text>
        <EditableTextCard
          label="Título do orçamento"
          value={titulo}
          placeholder="Ex.: Reforma da cozinha"
          editable={!salvando}
          onChangeText={setTitulo}
        />
        <Selector
          label="Cliente"
          placeholder={carregando ? 'Carregando clientes...' : 'Selecione um cliente'}
          value={clienteId}
          options={opcoesClientes}
          loading={carregando}
          disabled={carregando || salvando}
          onChange={setClienteId}
        />
        <EditableTextCard label="Criado em" value={criadoEm || 'Automático ao salvar'} editable={false} />
        {editando && <EditableTextCard label="Atualizado em" value={atualizadoEm} editable={false} />}

        <View style={styles.itemsHeader}>
          <Text style={styles.sectionTitle}>Produtos</Text>
          <Text style={styles.itemCount}>{itens.length} {itens.length === 1 ? 'item' : 'itens'}</Text>
        </View>

        {!itens.length && (
          <Text style={styles.emptyText}>Adicione produtos para compor este orçamento.</Text>
        )}
        <ClickableTextCard
          label="Produtos"
          value=""
          placeholder={carregando ? 'Carregando produtos...' : 'Toque para adicionar um produto'}
          onPress={() => setModalProdutosVisivel(true)}
        />
        {itens.map((item, index) => {
          const produto = produtos.find((opcao) => opcao.id === item.produto_id);
          if (!produto) return null;
          return (
            <View key={item.key} style={styles.itemCard}>
              <View style={styles.itemTitleRow}>
                <Text style={styles.itemTitle}>{index + 1}. {produto.nome}</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${produto.nome} do orçamento`}
                  disabled={salvando}
                  onPress={() => setItens((atuais) => atuais.filter((atual) => atual.key !== item.key))}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#C62828" />
                </TouchableOpacity>
              </View>
              <Text style={styles.stockText}>
                Categoria: {produto.categoria_titulo ?? 'Sem categoria'} · Estoque: {Number(produto.estoque)} {produto.unidade_medida_sigla ?? 'un.'}
              </Text>
              <View style={styles.itemFields}>
                <EditableTextCard
                  label="Quantidade"
                  value={item.quantidade}
                  tipo="number"
                  placeholder="1"
                  editable={!salvando}
                  onChangeText={(quantidade) => atualizarQuantidade(item.key, quantidade)}
                  width="48%"
                />
                <EditableTextCard
                  label="Preço unitário"
                  value={String(item.preco_unitario)}
                  tipo="number"
                  money
                  editable={false}
                  width="48%"
                />
              </View>
              <Text style={styles.subtotal}>
                Subtotal: {formatMoney((Number(item.quantidade) || 0) * item.preco_unitario)}
              </Text>
            </View>
          );
        })}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total do orçamento</Text>
          <Text style={styles.totalValue}>{formatMoney(valorTotal)}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            title={salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar orçamento'}
            disabled={salvando || carregando || !clientes.length || !produtos.length}
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

      <Modal
        visible={modalProdutosVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalProdutosVisivel(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalProdutosVisivel(false)}>
          <Pressable style={styles.productModal} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Adicionar produto</Text>
                <Text style={styles.modalSubtitle}>{produtosDisponiveis.length} disponíveis</Text>
              </View>
              <TouchableOpacity onPress={() => setModalProdutosVisivel(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#062046" />
              </TouchableOpacity>
            </View>
            <SearchBar
              placeholder="Busque por nome, categoria ou fornecedor"
              value={buscaProduto}
              onChangeText={setBuscaProduto}
            />
            <FlatList
              horizontal
              data={[{ id: 'todas', label: 'Todas' }, ...categorias]}
              keyExtractor={(categoria) => categoria.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFilters}
              renderItem={({ item: categoria }) => (
                <TooltipChip
                  label={categoria.label}
                  active={categoria.id === 'todas' ? categoriaSelecionada === null : categoriaSelecionada === categoria.id}
                  onPress={() => setCategoriaSelecionada(categoria.id === 'todas' ? null : categoria.id)}
                />
              )}
            />
            <FlatList
              data={produtosDisponiveis}
              keyExtractor={(produto) => produto.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.productList}
              ListEmptyComponent={<Text style={styles.emptyText}>Nenhum produto encontrado.</Text>}
              renderItem={({ item: produto }) => (
                <Produto
                  nome={produto.nome}
                  preco={Number(produto.preco_venda ?? 0)}
                  estoque={Number(produto.estoque)}
                  unidade={produto.unidade_medida_sigla}
                  categoria={produto.categoria_titulo}
                  imagem={produto.imagem_principal?.url ?? null}
                  onPress={() => escolherProduto(produto)}
                />
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

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
  itemTitle: { flex: 1, color: '#062046', fontSize: 16, fontWeight: '800' },
  removeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FDECEC' },
  stockText: { color: '#64748B', fontSize: 13, marginTop: 4 },
  itemFields: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  subtotal: { color: '#334155', fontSize: 15, fontWeight: '700', textAlign: 'right', marginTop: 2 },
  emptyText: { color: '#64748B', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  totalCard: { marginTop: 18, marginBottom: 16, backgroundColor: '#062046', borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: '#DCE8F8', fontSize: 15, fontWeight: '700' },
  totalValue: { color: '#fff', fontSize: 21, fontWeight: '900' },
  actions: { marginTop: 14, gap: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  productModal: { height: '88%', backgroundColor: '#F6F8FB', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 18, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginBottom: 10 },
  modalTitle: { color: '#062046', fontSize: 21, fontWeight: '900' },
  modalSubtitle: { color: '#64748B', fontSize: 13, marginTop: 2 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E7EDF5', alignItems: 'center', justifyContent: 'center' },
  categoryFilters: { paddingHorizontal: 12, gap: 8, paddingBottom: 8 },
  productList: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 28 },
});

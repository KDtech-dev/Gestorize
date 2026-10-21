import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import Button from '@components/botoes/Button';
import DialogConfirmarAcao from '@components/dialogs/DialogConfirmarAcao';
import EditableTextCard from '@components/EditableTextCard';
import Nav from '@components/utilities/Nav';
import ClickableTextCard from '@components/ClickableTextCard';
import OrcamentoClientePicker from '@components/orcamentos/OrcamentoClientePicker';
import OrcamentoItemCard, { OrcamentoItemForm } from '@components/orcamentos/OrcamentoItemCard';
import OrcamentoProdutoPicker from '@components/orcamentos/OrcamentoProdutoPicker';
import { getClientes } from '@api/apiClientes';
import {
  createOrcamento,
  deleteOrcamento,
  getOrcamento,
  aprovarOrcamento,
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
import { useAuth } from '@context/AuthContext';
import Toast from 'react-native-toast-message';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = NativeStackScreenProps<RootStackParamList, 'NovoOrcamento'>['route'];
const novoItem = (produto: ProdutoType, item?: OrcamentoItemType): OrcamentoItemForm => ({
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
  const { user } = useAuth();
  const modo = route.params?.modo ?? 'criar';
  const orcamentoId = route.params?.orcamentoId;
  const editando = modo === 'editar';

  const [clientes, setClientes] = useState<ClienteType[]>([]);
  const [produtos, setProdutos] = useState<ProdutoType[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [itens, setItens] = useState<OrcamentoItemForm[]>([]);
  const [criadoEm, setCriadoEm] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState('');
  const [statusOrcamento, setStatusOrcamento] = useState<'pendente' | 'aprovado'>('pendente');
  const [aprovadorNome, setAprovadorNome] = useState('');
  const [aprovadoEm, setAprovadoEm] = useState('');
  const bloqueado = editando && statusOrcamento === 'aprovado';
  const [modalProdutosVisivel, setModalProdutosVisivel] = useState(false);
  const [modalClientesVisivel, setModalClientesVisivel] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const podeAprovar = ['admin'].includes(user?.role)
    || user?.permissions?.some((permission: string) => ['orcamentos.criar', 'orcamentos.editar', 'orcamentos.aprovar'].includes(permission));

  const opcoesClientes = useMemo(
    () => clientes.map((cliente) => ({ id: cliente.id, nome: cliente.nome })),
    [clientes],
  );

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
        setStatusOrcamento(orcamento.status ?? 'pendente');
        setAprovadorNome(orcamento.aprovador_nome ?? '');
        setAprovadoEm(orcamento.aprovado_em ? dataHora(orcamento.aprovado_em) : '');

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
  };

  const escolherCliente = (cliente: ClienteType) => {
    setClienteId(cliente.id);
    setModalClientesVisivel(false);
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

  const confirmarAprovacao = async () => {
    if (!orcamentoId) return;
    try {
      setSalvando(true);
      const response = await aprovarOrcamento(orcamentoId);
      const orcamento = response.data;
      setStatusOrcamento(orcamento.status ?? 'aprovado');
      setAprovadorNome(orcamento.aprovador_nome ?? '');
      setAprovadoEm(orcamento.aprovado_em ? dataHora(orcamento.aprovado_em) : dataHora(new Date().toISOString()));
      Toast.show({ type: 'success', text1: 'Orçamento aprovado' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Não foi possível aprovar', text2: error?.response?.data?.message ?? 'Tente novamente.' });
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
          editable={!salvando && !bloqueado}
          onChangeText={setTitulo}
        />
        <ClickableTextCard
          label="Cliente"
          value={opcoesClientes.find((cliente) => cliente.id === clienteId)?.nome ?? ''}
          placeholder={carregando ? 'Carregando clientes...' : 'Selecione um cliente'}
          disabled={bloqueado}
          onPress={!carregando && !salvando && !bloqueado ? () => setModalClientesVisivel(true) : undefined}
        />
        <EditableTextCard label="Criado em" value={criadoEm || 'Automático ao salvar'} editable={false} />
        {editando && <EditableTextCard label="Atualizado em" value={atualizadoEm} editable={false} />}
        {editando && (
          <View style={[styles.approvalCard, { borderColor: statusOrcamento === 'aprovado' ? '#16a34a' : '#d97706' }]}>
            <Text style={[styles.approvalTitle, { color: statusOrcamento === 'aprovado' ? '#15803d' : '#b45309' }]}>
              {statusOrcamento === 'aprovado' ? '✓ Orçamento aprovado' : '◷ Aguardando aprovação'}
            </Text>
            {statusOrcamento === 'aprovado' && (
              <Text style={styles.approvalDetail}>
                {aprovadorNome ? `Aprovado por ${aprovadorNome}` : 'Aprovação registrada'}{aprovadoEm ? ` · ${aprovadoEm}` : ''}
              </Text>
            )}
          </View>
        )}

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
          disabled={bloqueado}
          onPress={!carregando && !salvando && !bloqueado ? () => setModalProdutosVisivel(true) : undefined}
        />
        {itens.map((item, index) => {
          const produto = produtos.find((opcao) => opcao.id === item.produto_id);
          if (!produto) return null;
          return <OrcamentoItemCard
            key={item.key}
            item={item}
            produto={produto}
            index={index}
            disabled={salvando || bloqueado}
            onChangeQuantidade={(quantidade) => atualizarQuantidade(item.key, quantidade)}
            onRemove={() => setItens((atuais) => atuais.filter((atual) => atual.key !== item.key))}
          />;
        })}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total do orçamento</Text>
          <Text style={styles.totalValue}>{formatMoney(valorTotal)}</Text>
        </View>

        <View style={styles.actions}>
          {editando && statusOrcamento === 'pendente' && podeAprovar && (
            <Button title="Aprovar orçamento" disabled={salvando || carregando} onPress={() => setShowApproveDialog(true)} />
          )}
          <Button
            title={salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar orçamento'}
            disabled={salvando || bloqueado || carregando || !clientes.length || !produtos.length}
            onPress={salvar}
          />
          {editando && (
            <Button
              title="Excluir orçamento"
              variant="delete"
              disabled={salvando || bloqueado}
              onPress={() => setShowDeleteDialog(true)}
            />
          )}
        </View>
      </ScrollView>

      <OrcamentoProdutoPicker
        visible={modalProdutosVisivel}
        products={produtos}
        selectedProductIds={itens.map((item) => item.produto_id)}
        onSelect={escolherProduto}
        onClose={() => setModalProdutosVisivel(false)}
      />

      <OrcamentoClientePicker
        visible={modalClientesVisivel}
        clients={clientes}
        onSelect={escolherCliente}
        onClose={() => setModalClientesVisivel(false)}
      />

      <DialogConfirmarAcao
        show={showDeleteDialog}
        setShow={setShowDeleteDialog}
        titulo="Tem certeza que deseja excluir este orçamento?"
        onSuccess={confirmarExclusao}
      />
      <DialogConfirmarAcao
        show={showApproveDialog}
        setShow={setShowApproveDialog}
        titulo="Confirmar aprovação deste orçamento?"
        onSuccess={confirmarAprovacao}
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
  emptyText: { color: '#64748B', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  totalCard: { marginTop: 18, marginBottom: 16, backgroundColor: '#062046', borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: '#DCE8F8', fontSize: 15, fontWeight: '700' },
  totalValue: { color: '#fff', fontSize: 21, fontWeight: '900' },
  actions: { marginTop: 14, gap: 12 },
  approvalCard: { marginTop: 12, borderWidth: 1, borderRadius: 12, padding: 12, backgroundColor: '#ffffff' },
  approvalTitle: { fontSize: 15, fontWeight: '800' },
  approvalDetail: { marginTop: 4, color: '#64748B', fontSize: 12 },
});

import React, { useCallback, useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { List } from 'react-native-paper';
import Nav from '@components/utilities/Nav';
import Button from '@components/botoes/Button';
import { getProdutos } from '@api/apiProdutos';
import { getProdutoPorCodigo, getVendas, registrarVenda, VendaType } from '@api/apiVendas';
import { ProdutoType } from '@context/types';
import { ClienteType } from '@context/types';
import OrcamentoProdutoPicker from '@components/orcamentos/OrcamentoProdutoPicker';
import OrcamentoClientePicker from '@components/orcamentos/OrcamentoClientePicker';
import { getClientes } from '@api/apiClientes';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { can } from '@utils/permissions';
import Toast from 'react-native-toast-message';

type CarrinhoItem = { produto: ProdutoType; quantidade: number };
const moeda = (valor: number | string | null | undefined) => Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Vendas() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const podeCriar = can(user, 'vendas.criar');
  const [produtos, setProdutos] = useState<ProdutoType[]>([]);
  const [vendas, setVendas] = useState<VendaType[]>([]);
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [codigo, setCodigo] = useState('');
  const [seletorProdutosVisivel, setSeletorProdutosVisivel] = useState(false);
  const [clientes, setClientes] = useState<ClienteType[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteType | null>(null);
  const [clientesCarregados, setClientesCarregados] = useState(false);
  const [seletorClientesVisivel, setSeletorClientesVisivel] = useState(false);
  const [vendaAbertaId, setVendaAbertaId] = useState<string | undefined>();
  const [erroHistorico, setErroHistorico] = useState<string | null>(null);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [cameraVisivel, setCameraVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const processandoScan = useRef(false);

  const carregar = useCallback(async () => {
    setCarregandoHistorico(true);
    setCarregandoProdutos(true);
    const [produtosResult, vendasResult] = await Promise.allSettled([getProdutos(), getVendas()]);

    if (produtosResult.status === 'fulfilled') {
      setProdutos(produtosResult.value.data ?? []);
    } else {
      setProdutos([]);
      const status = produtosResult.reason?.response?.status;
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar produtos',
        text2: status === 403 ? 'Seu perfil não tem permissão para consultar produtos.' : produtosResult.reason?.response?.data?.message ?? 'Tente novamente.',
      });
    }
    setCarregandoProdutos(false);

    if (vendasResult.status === 'fulfilled') {
      setVendas(vendasResult.value.data ?? []);
      setErroHistorico(null);
    } else {
      const status = vendasResult.reason?.response?.status;
      const mensagem = status === 403
        ? 'Seu perfil precisa da permissão vendas.ver para consultar o histórico.'
        : status >= 500
          ? 'O backend não conseguiu consultar as vendas. Confirme as migrations de vendas e entre novamente para atualizar as permissões.'
          : vendasResult.reason?.response?.data?.message ?? 'Verifique a conexão com o backend e tente novamente.';
      setErroHistorico(mensagem);
      Toast.show({ type: 'error', text1: 'Erro ao carregar vendas', text2: mensagem });
    }

    setCarregandoHistorico(false);
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const total = carrinho.reduce((soma, item) => soma + Number(item.produto.preco_venda ?? 0) * item.quantidade, 0);

  const adicionarProduto = (produto: ProdutoType) => {
    if (!podeCriar) return;
    if (Number(produto.estoque) <= 0) {
      Toast.show({ type: 'info', text1: 'Produto sem estoque disponível.' });
      return;
    }
    setCarrinho((atual) => {
      const existente = atual.find((item) => item.produto.id === produto.id);
      if (existente) {
        if (existente.quantidade >= Number(produto.estoque)) return atual;
        return atual.map((item) => item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item);
      }
      return [...atual, { produto, quantidade: 1 }];
    });
  };

  const lerCodigo = async (valor = codigo) => {
    const texto = valor.trim();
    if (!texto) return;
    setCodigo('');
    Keyboard.dismiss();
    const local = produtos.find((item) => item.codigo_barras?.toLocaleLowerCase() === texto.toLocaleLowerCase());
    try {
      const produto = local ?? (await getProdutoPorCodigo(texto)).data;
      adicionarProduto(produto);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Código não encontrado', text2: error?.response?.data?.message ?? 'Confira o código e tente novamente.' });
    }
  };

  const escanear = async (data: string) => {
    if (processandoScan.current) return;
    processandoScan.current = true;
    setCameraVisivel(false);
    await lerCodigo(data);
    setTimeout(() => { processandoScan.current = false; }, 700);
  };

  const finalizarVenda = async () => {
    if (!carrinho.length || !podeCriar) return;
    try {
      setSalvando(true);
      await registrarVenda(
        carrinho.map(({ produto, quantidade }) => ({ produto_id: produto.id, quantidade })),
        clienteSelecionado?.id,
      );
      Toast.show({ type: 'success', text1: 'Venda registrada', text2: 'O estoque foi atualizado.' });
      setCarrinho([]);
      setClienteSelecionado(null);
      await carregar();
    } catch (error: any) {
      const mensagem = error?.response?.data?.errors?.itens?.[0] ?? error?.response?.data?.message ?? 'Não foi possível concluir a venda.';
      Toast.show({ type: 'error', text1: 'Erro ao registrar venda', text2: mensagem });
    } finally {
      setSalvando(false);
    }
  };

  const abrirSeletorClientes = async () => {
    if (!clientesCarregados) {
      try {
        const resposta = await getClientes();
        setClientes(resposta.data ?? []);
        setClientesCarregados(true);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Não foi possível carregar clientes',
          text2: error?.response?.status === 403
            ? 'Seu perfil não tem permissão para consultar clientes.'
            : error?.response?.data?.message ?? 'Tente novamente.',
        });
        return;
      }
    }
    setSeletorClientesVisivel(true);
  };

  const atualizarQuantidade = (produtoId: string, delta: number) => {
    setCarrinho((atual) => atual.flatMap((item) => {
      if (item.produto.id !== produtoId) return [item];
      const quantidade = item.quantidade + delta;
      if (quantidade <= 0) return [];
      if (quantidade > Number(item.produto.estoque)) return [item];
      return [{ ...item, quantidade }];
    }));
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Nav title="Vendas" subtitle="PDV e movimentação de estoque" onBackPress={() => navigation.goBack()} rightType="menu" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.desktopContent}>
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.heading, { color: colors.text }]}>Adicionar produtos</Text>
            <Text style={[styles.hint, { color: colors.muted }]}>Use a câmera, um leitor conectado ou selecione na lista por categoria.</Text>
            <View style={styles.scanRow}>
              <TextInput
                value={codigo}
                onChangeText={setCodigo}
                onSubmitEditing={() => lerCodigo()}
                placeholder="Leia ou digite o código de barras"
                placeholderTextColor={colors.muted}
                returnKeyType="search"
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <Pressable disabled={!podeCriar} onPress={() => lerCodigo()} style={[styles.iconButton, { backgroundColor: colors.primary, opacity: podeCriar ? 1 : 0.55 }]} accessibilityLabel="Buscar código">
                <MaterialCommunityIcons name="barcode-scan" size={22} color="#fff" />
              </Pressable>
              <Pressable disabled={!podeCriar} onPress={async () => {
                if (!permission?.granted) {
                  const result = await requestPermission();
                  if (!result.granted) {
                    Toast.show({ type: 'info', text1: 'Permissão da câmera necessária para ler o código.' });
                    return;
                  }
                }
                setCameraVisivel(true);
              }} style={[styles.iconButton, { backgroundColor: colors.elevated, opacity: podeCriar ? 1 : 0.55 }]} accessibilityLabel="Abrir câmera">
                <MaterialCommunityIcons name="camera-outline" size={22} color={colors.text} />
              </Pressable>
            </View>
            <Pressable
              disabled={!podeCriar || !produtos.length || carregandoProdutos}
              onPress={() => setSeletorProdutosVisivel(true)}
              style={[styles.selectProductsButton, { borderColor: colors.border, backgroundColor: colors.background, opacity: !podeCriar || !produtos.length ? 0.55 : 1 }]}
            >
              <MaterialCommunityIcons name="magnify" size={21} color={colors.primary} />
              <Text style={[styles.selectProductsText, { color: colors.text }]}>{carregandoProdutos ? 'Carregando produtos...' : 'Pesquisar e selecionar produtos'}</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionRow}>
              <Text style={[styles.heading, { color: colors.text }]}>Carrinho ({carrinho.length})</Text>
              <Text style={[styles.total, { color: colors.primary }]}>{moeda(total)}</Text>
            </View>
            <Pressable onPress={abrirSeletorClientes} style={[styles.selectProductsButton, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <MaterialCommunityIcons name="account-outline" size={21} color={colors.primary} />
              <Text style={[styles.selectProductsText, { color: colors.text }]}>{clienteSelecionado?.nome ?? 'Associar cliente (opcional)'}</Text>
              {clienteSelecionado ? (
                <Pressable onPress={(event) => { event.stopPropagation(); setClienteSelecionado(null); }} accessibilityLabel="Remover cliente">
                  <MaterialCommunityIcons name="close-circle" size={21} color={colors.muted} />
                </Pressable>
              ) : <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />}
            </Pressable>
            {carrinho.length === 0 ? <Text style={[styles.hint, { color: colors.muted }]}>Selecione um produto para iniciar a venda.</Text> : null}
            {carrinho.map(({ produto, quantidade }) => (
              <View key={produto.id} style={[styles.cartRow, { borderColor: colors.border }]}>
                <View style={styles.productCopy}>
                  <Text style={[styles.productName, { color: colors.text }]}>{produto.nome}</Text>
                  <Text style={[styles.hint, { color: colors.muted }]}>{moeda(produto.preco_venda)} cada · estoque {produto.estoque}</Text>
                </View>
                <Pressable onPress={() => atualizarQuantidade(produto.id, -1)}><MaterialCommunityIcons name="minus-circle-outline" size={25} color={colors.primary} /></Pressable>
                <Text style={[styles.quantity, { color: colors.text }]}>{quantidade}</Text>
                <Pressable onPress={() => atualizarQuantidade(produto.id, 1)}><MaterialCommunityIcons name="plus-circle-outline" size={25} color={colors.primary} /></Pressable>
              </View>
            ))}
            <Button title={salvando ? 'Registrando...' : 'Finalizar venda'} onPress={finalizarVenda} disabled={!podeCriar || !carrinho.length || salvando} />
            {!podeCriar ? <Text style={[styles.hint, { color: colors.muted }]}>Seu perfil pode consultar vendas, mas não registrá-las.</Text> : null}
          </View>

          <View style={[styles.panel, styles.history, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionRow}>
              <Text style={[styles.heading, { color: colors.text }]}>Histórico de vendas</Text>
              <Text style={[styles.hint, { color: colors.muted }]}>{vendas.length} registros</Text>
            </View>
            {erroHistorico ? <Text style={[styles.error, { color: colors.error }]}>{erroHistorico}</Text> : null}
            {carregandoHistorico ? <Text style={[styles.hint, { color: colors.muted }]}>Carregando histórico...</Text> : null}
            {!carregandoHistorico && !erroHistorico && vendas.length === 0 ? <Text style={[styles.hint, { color: colors.muted }]}>Ainda não há vendas registradas.</Text> : null}
            {vendas.map((venda) => (
              <List.Accordion
                key={venda.id}
                title={`Venda · ${new Date(venda.vendido_em).toLocaleString('pt-BR')}`}
                description={`${venda.itens.length} produtos · ${moeda(venda.valor_total)}`}
                expanded={vendaAbertaId === venda.id}
                onPress={() => setVendaAbertaId((atual) => atual === venda.id ? undefined : venda.id)}
                titleNumberOfLines={2}
                titleStyle={[styles.historyTitle, { color: colors.text }]}
                descriptionStyle={{ color: colors.muted }}
                style={[styles.historyAccordion, { backgroundColor: colors.background, borderColor: colors.border }]}
                rippleColor={colors.border}
              >
                <View style={[styles.saleDetails, { borderColor: colors.border }]}>
                  <Text style={[styles.saleMeta, { color: colors.muted }]}>Cliente: {venda.cliente_nome || 'Não informado'}</Text>
                  <Text style={[styles.saleMeta, { color: colors.muted }]}>Vendedor: {venda.vendedor || 'Equipe'}</Text>
                  {venda.itens.map((item) => (
                    <View key={item.id} style={[styles.saleItem, { borderColor: colors.border }]}>
                      <View style={styles.productCopy}>
                        <Text style={[styles.productName, { color: colors.text }]}>{item.produto_nome}</Text>
                        <Text style={[styles.hint, { color: colors.muted }]}>{item.quantidade} × {moeda(item.preco_unitario)}</Text>
                      </View>
                      <Text style={[styles.price, { color: colors.text }]}>{moeda(item.subtotal)}</Text>
                    </View>
                  ))}
                  <View style={styles.sectionRow}>
                    <Text style={[styles.totalLabel, { color: colors.text }]}>Total da venda</Text>
                    <Text style={[styles.total, { color: colors.primary }]}>{moeda(venda.valor_total)}</Text>
                  </View>
                </View>
              </List.Accordion>
            ))}
          </View>
        </View>
      </ScrollView>

      <OrcamentoProdutoPicker
        visible={seletorProdutosVisivel}
        products={produtos.filter((produto) => Number(produto.estoque) > 0)}
        selectedProductIds={carrinho.map((item) => item.produto.id)}
        onSelect={(produto) => { adicionarProduto(produto); setSeletorProdutosVisivel(false); }}
        onClose={() => setSeletorProdutosVisivel(false)}
      />
      <OrcamentoClientePicker
        visible={seletorClientesVisivel}
        clients={clientes}
        selectedClientId={clienteSelecionado?.id}
        onSelect={(cliente) => { setClienteSelecionado(cliente); setSeletorClientesVisivel(false); }}
        onClose={() => setSeletorClientesVisivel(false)}
      />

      <Modal visible={cameraVisivel} animationType="slide" onRequestClose={() => setCameraVisivel(false)}>
        <View style={styles.cameraScreen}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={({ data }: { data: string }) => escanear(data)}
          />
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraTitle}>Aponte para o código do produto</Text>
            <View style={styles.scanFrame} />
            <Pressable onPress={() => setCameraVisivel(false)} style={styles.closeCamera}>
              <Text style={styles.closeCameraText}>Fechar câmera</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  desktopContent: { width: '100%', maxWidth: 960, alignSelf: 'center' },
  panel: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12, gap: 10 },
  heading: { fontSize: 18, fontWeight: '800' },
  hint: { fontSize: 13, lineHeight: 19 },
  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 14 },
  iconButton: { height: 48, width: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selectProductsButton: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  selectProductsText: { flex: 1, fontWeight: '700', fontSize: 14 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  total: { fontSize: 20, fontWeight: '900' },
  cartRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  productCopy: { flex: 1, gap: 3 },
  productName: { fontSize: 15, fontWeight: '700' },
  quantity: { minWidth: 24, textAlign: 'center', fontWeight: '800' },
  price: { fontWeight: '900', fontSize: 16 },
  history: { marginTop: 12 },
  historyTitle: { fontWeight: '800' },
  historyAccordion: { borderWidth: 1, borderRadius: 14, marginTop: 9, overflow: 'hidden' },
  saleDetails: { padding: 14, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  saleMeta: { fontSize: 13 },
  saleItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  totalLabel: { fontSize: 15, fontWeight: '800' },
  error: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  cameraScreen: { flex: 1, backgroundColor: '#000' },
  cameraOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'space-around', padding: 28 },
  cameraTitle: { color: '#fff', fontWeight: '800', fontSize: 18, textAlign: 'center', backgroundColor: '#0009', padding: 12, borderRadius: 12 },
  scanFrame: { width: '88%', height: 180, borderWidth: 3, borderColor: '#FACC15', borderRadius: 20 },
  closeCamera: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24 },
  closeCameraText: { color: '#111827', fontWeight: '800' },
});

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
import Nav from '@components/utilities/Nav';
import Button from '@components/botoes/Button';
import { getProdutos } from '@api/apiProdutos';
import { FormaPagamento, getProdutoPorCodigo, registrarVenda } from '@api/apiVendas';
import { OrcamentoType, ProdutoType } from '@context/types';
import { ClienteType } from '@context/types';
import OrcamentoProdutoPicker from '@components/orcamentos/OrcamentoProdutoPicker';
import OrcamentoClientePicker from '@components/orcamentos/OrcamentoClientePicker';
import { getClientes } from '@api/apiClientes';
import { getOrcamentos } from '@api/apiOrcamentos';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { can, canSell } from '@utils/permissions';
import Toast from 'react-native-toast-message';

type CarrinhoItem = { produto: ProdutoType; quantidade: number; precoUnitario?: number };
const moeda = (valor: number | string | null | undefined) => Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const lerDesconto = (valor: string, percentual: boolean) => percentual
  ? Number(valor.replace(',', '.')) || 0
  : (Number(valor.replace(/\D/g, '')) || 0) / 100;
const formatarDesconto = (valor: string, percentual: boolean) => {
  if (percentual) {
    const limpo = valor.replace(/[^\d,.]/g, '').replace('.', ',');
    const [inteiro = '', ...decimais] = limpo.split(',');
    return decimais.length ? `${inteiro},${decimais.join('').slice(0, 2)}` : inteiro;
  }
  const centavos = Number(valor.replace(/\D/g, ''));
  return centavos ? `R$ ${ (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
};
const exibirPercentual = (valor: number) => valor ? String(valor).replace('.', ',') : '';

export default function NovaVenda() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const corAcao = isDark ? '#2563EB' : colors.primary;
  const { user } = useAuth();
  const podeCriar = canSell(user);
  const podeVerClientes = can(user, 'clientes.ver');
  const podeVerOrcamentos = can(user, 'orcamentos.ver');
  const [produtos, setProdutos] = useState<ProdutoType[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoType[]>([]);
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<OrcamentoType | null>(null);
  const [seletorOrcamentosVisivel, setSeletorOrcamentosVisivel] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [desconto, setDesconto] = useState('');
  const [descontoPercentual, setDescontoPercentual] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [seletorProdutosVisivel, setSeletorProdutosVisivel] = useState(false);
  const [clientes, setClientes] = useState<ClienteType[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteType | null>(null);
  const [clientesCarregados, setClientesCarregados] = useState(false);
  const [seletorClientesVisivel, setSeletorClientesVisivel] = useState(false);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [cameraVisivel, setCameraVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const processandoScan = useRef(false);

  const carregar = useCallback(async () => {
    setCarregandoProdutos(true);
    const [produtosResult, orcamentosResult] = await Promise.allSettled([
      podeCriar ? getProdutos() : Promise.resolve(null),
      podeVerOrcamentos ? getOrcamentos() : Promise.resolve(null),
    ]);

    if (!podeCriar) {
      setProdutos([]);
    } else if (produtosResult.status === 'fulfilled' && produtosResult.value) {
      setProdutos(produtosResult.value.data ?? []);
    } else {
      setProdutos([]);
      const erro = produtosResult.status === 'rejected' ? produtosResult.reason : null;
      const status = erro?.response?.status;
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar produtos',
        text2: status === 403 ? 'Seu perfil não tem permissão para consultar produtos.' : erro?.response?.data?.message ?? 'Tente novamente.',
      });
    }
    setCarregandoProdutos(false);
    if (orcamentosResult.status === 'fulfilled' && orcamentosResult.value) {
      setOrcamentos((orcamentosResult.value.data ?? []).filter((orcamento) => orcamento.status === 'aprovado'));
    } else if (orcamentosResult.status === 'rejected') {
      setOrcamentos([]);
    }
  }, [podeCriar, podeVerOrcamentos]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const subtotal = carrinho.reduce((soma, item) => soma + Number(item.precoUnitario ?? item.produto.preco_venda ?? 0) * item.quantidade, 0);
  const descontoInformado = Math.max(0, lerDesconto(desconto, descontoPercentual));
  const descontoAplicado = Math.min(subtotal, descontoPercentual ? subtotal * Math.min(descontoInformado, 100) / 100 : descontoInformado);
  const total = subtotal - descontoAplicado;

  const adicionarProduto = (produto: ProdutoType) => {
    if (!podeCriar) return;
    if (orcamentoSelecionado) setOrcamentoSelecionado(null);
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

  const selecionarOrcamento = (orcamento: OrcamentoType) => {
    const linhas = (orcamento.itens ?? []).map((item) => {
      const produto = produtos.find((produtoDisponivel) => produtoDisponivel.id === item.produto_id) ?? item.produto;
      return produto ? { produto, quantidade: Number(item.quantidade), precoUnitario: Number(item.preco_unitario) } : null;
    });
    const itensAgrupados = new Map<string, CarrinhoItem & { valor: number }>();
    linhas.forEach((item) => {
      if (!item) return;
      const existente = itensAgrupados.get(item.produto.id) ?? { ...item, quantidade: 0, valor: 0 };
      existente.quantidade += item.quantidade;
      existente.valor += Number(item.precoUnitario) * item.quantidade;
      existente.precoUnitario = existente.valor / existente.quantidade;
      itensAgrupados.set(item.produto.id, existente);
    });
    const itens = [...itensAgrupados.values()].map(({ valor: _valor, ...item }) => item);
    setOrcamentoSelecionado(orcamento);
    setCarrinho(itens);
    setClienteSelecionado(orcamento.cliente ?? null);
    setSeletorOrcamentosVisivel(false);
    if (linhas.some((item) => !item)) Toast.show({ type: 'error', text1: 'Há produtos do orçamento indisponíveis para venda.' });
    else if (itens.some((item) => item.quantidade > Number(item.produto.estoque))) Toast.show({ type: 'error', text1: 'Estoque insuficiente para concluir este orçamento.' });
  };

  const finalizarVenda = async () => {
    if (!carrinho.length || !podeCriar) return;
    try {
      setSalvando(true);
      await registrarVenda(
        carrinho.map(({ produto, quantidade }) => ({ produto_id: produto.id, quantidade })),
        clienteSelecionado?.id ?? orcamentoSelecionado?.cliente_id,
        { orcamentoId: orcamentoSelecionado?.id, formaPagamento, desconto: descontoAplicado },
      );
      Toast.show({ type: 'success', text1: 'Venda registrada', text2: 'O estoque foi atualizado.' });
      setCarrinho([]);
      setClienteSelecionado(null);
      setOrcamentoSelecionado(null);
      setDesconto('');
      setFormaPagamento('pix');
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
    if (orcamentoSelecionado) setOrcamentoSelecionado(null);
    setCarrinho((atual) => atual.flatMap((item) => {
      if (item.produto.id !== produtoId) return [item];
      const quantidade = item.quantidade + delta;
      if (quantidade <= 0) return [];
      if (quantidade > Number(item.produto.estoque)) return [item];
      return [{ ...item, quantidade }];
    }));
  };

  const selecionarModoDesconto = (percentual: boolean) => {
    if (percentual === descontoPercentual) return;
    const valorAtual = lerDesconto(desconto, descontoPercentual);
    setDesconto(percentual ? exibirPercentual(valorAtual) : formatarDesconto(String(Math.round(valorAtual * 100)), false));
    setDescontoPercentual(percentual);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Nav title="Nova venda" subtitle="Caixa e registro de vendas" onBackPress={() => navigation.goBack()} rightType="menu" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.desktopContent}>
          {podeCriar && <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.heading, { color: colors.text }]}>Adicionar produtos</Text>
            <Text style={[styles.hint, { color: colors.muted }]}>Use a câmera, um leitor conectado ou selecione na lista por categoria.</Text>
            {podeVerOrcamentos ? <Pressable onPress={() => setSeletorOrcamentosVisivel(true)} style={[styles.selectProductsButton, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <MaterialCommunityIcons name="file-document-check-outline" size={21} color={colors.primary} />
              <Text style={[styles.selectProductsText, { color: colors.text }]}>{orcamentoSelecionado ? `Orçamento: ${orcamentoSelecionado.titulo}` : 'Vender a partir de orçamento aprovado'}</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable> : null}
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
              <Pressable disabled={!podeCriar} onPress={() => lerCodigo()} style={[styles.iconButton, { backgroundColor: colors.elevated, borderColor: colors.border, borderWidth: 1, opacity: podeCriar ? 1 : 0.55 }]} accessibilityRole="button" accessibilityLabel="Buscar código">
                <MaterialCommunityIcons name="barcode-scan" size={22} color={colors.muted} />
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
              }} style={[styles.cameraButton, { backgroundColor: corAcao, borderColor: corAcao, opacity: podeCriar ? 1 : 0.55 }]} accessibilityRole="button" accessibilityLabel="Abrir câmera para escanear produto">
                <MaterialCommunityIcons name="camera-outline" size={21} color="#fff" />
                <Text style={styles.cameraButtonText}>Câmera</Text>
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
          </View>}

          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionRow}>
              <Text style={[styles.heading, { color: colors.text }]}>Carrinho ({carrinho.length})</Text>
              <Text style={[styles.total, { color: colors.primary }]}>{moeda(total)}</Text>
            </View>
            <Pressable disabled={!podeVerClientes} onPress={abrirSeletorClientes} style={[styles.selectProductsButton, { borderColor: colors.border, backgroundColor: colors.background, opacity: podeVerClientes ? 1 : 0.65 }]}>
              <MaterialCommunityIcons name="account-outline" size={21} color={colors.primary} />
              <Text style={[styles.selectProductsText, { color: colors.text }]}>{clienteSelecionado?.nome ?? (podeVerClientes ? 'Associar cliente (opcional)' : 'Venda sem cliente')}</Text>
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
                  <Text style={[styles.hint, { color: colors.muted }]}>{moeda(carrinho.find((item) => item.produto.id === produto.id)?.precoUnitario ?? produto.preco_venda)} cada · estoque {produto.estoque}</Text>
                </View>
                <Pressable onPress={() => atualizarQuantidade(produto.id, -1)}><MaterialCommunityIcons name="minus-circle-outline" size={25} color={colors.primary} /></Pressable>
                <Text style={[styles.quantity, { color: colors.text }]}>{quantidade}</Text>
                <Pressable onPress={() => atualizarQuantidade(produto.id, 1)}><MaterialCommunityIcons name="plus-circle-outline" size={25} color={colors.primary} /></Pressable>
              </View>
            ))}
            <View style={styles.discountHeader}>
              <Text style={[styles.paymentLabel, { color: colors.text }]}>Desconto</Text>
              <View style={[styles.discountModes, { backgroundColor: colors.background, borderColor: colors.border }]} accessibilityRole="radiogroup">
                <Pressable accessibilityRole="radio" accessibilityState={{ selected: descontoPercentual }} accessibilityLabel="Desconto percentual" onPress={() => selecionarModoDesconto(true)} style={[styles.discountMode, { backgroundColor: descontoPercentual ? corAcao : 'transparent' }]}>
                  <Text style={[styles.discountModeText, { color: descontoPercentual ? '#fff' : colors.text }]}>% Percentual</Text>
                </Pressable>
                <Pressable accessibilityRole="radio" accessibilityState={{ selected: !descontoPercentual }} accessibilityLabel="Desconto em valor" onPress={() => selecionarModoDesconto(false)} style={[styles.discountMode, { backgroundColor: !descontoPercentual ? corAcao : 'transparent' }]}>
                  <Text style={[styles.discountModeText, { color: !descontoPercentual ? '#fff' : colors.text }]}>R$ Valor</Text>
                </Pressable>
              </View>
            </View>
            <TextInput value={desconto} onChangeText={(valor) => setDesconto(formatarDesconto(valor, descontoPercentual))} keyboardType="decimal-pad" placeholder={descontoPercentual ? 'Informe o percentual' : 'R$ 0,00'} placeholderTextColor={colors.muted} style={[styles.discountInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} />
            <Text style={[styles.hint, { color: colors.muted }]}>Desconto aplicado: {moeda(descontoAplicado)}</Text>
            <Text style={[styles.paymentLabel, { color: colors.text }]}>Forma de pagamento</Text>
            <View style={styles.paymentOptions}>{([
              ['pix', 'Pix'], ['dinheiro', 'Dinheiro'], ['debito', 'Débito'], ['credito', 'Crédito'],
            ] as [FormaPagamento, string][]).map(([value, label]) => <Pressable key={value} onPress={() => setFormaPagamento(value)} style={[styles.paymentOption, { borderColor: formaPagamento === value ? colors.primary : colors.border, backgroundColor: formaPagamento === value ? colors.elevated : colors.background }]}><Text style={{ color: colors.text, fontSize: 15, fontWeight: formaPagamento === value ? '800' : '600' }}>{label}</Text></Pressable>)}</View>
            <View style={styles.sectionRow}><Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text><Text style={[styles.total, { color: colors.primary }]}>{moeda(total)}</Text></View>
            <Button title={salvando ? 'Registrando...' : 'Finalizar venda'} onPress={finalizarVenda} disabled={!podeCriar || !carrinho.length || salvando} />
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
        onSelect={(cliente) => {
          if (orcamentoSelecionado && orcamentoSelecionado.cliente_id !== cliente.id) {
            setOrcamentoSelecionado(null);
            setCarrinho([]);
          }
          setClienteSelecionado(cliente);
          setSeletorClientesVisivel(false);
        }}
        onClose={() => setSeletorClientesVisivel(false)}
      />

      <Modal visible={seletorOrcamentosVisivel} animationType="slide" onRequestClose={() => setSeletorOrcamentosVisivel(false)}>
        <View style={[styles.modalScreen, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.heading, { color: colors.text }]}>Orçamentos aprovados</Text>
            <Pressable onPress={() => setSeletorOrcamentosVisivel(false)} accessibilityLabel="Fechar orçamentos"><MaterialCommunityIcons name="close" size={25} color={colors.text} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.quoteList}>
            {orcamentos.map((orcamento) => <Pressable key={orcamento.id} onPress={() => selecionarOrcamento(orcamento)} style={[styles.quoteOption, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={styles.productCopy}><Text style={[styles.productName, { color: colors.text }]}>{orcamento.titulo}</Text><Text style={[styles.hint, { color: colors.muted }]}>{orcamento.cliente?.nome ?? 'Cliente'} · {moeda(orcamento.valor_total)}</Text></View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>)}
            {!orcamentos.length ? <Text style={[styles.hint, { color: colors.muted }]}>Nenhum orçamento aprovado disponível.</Text> : null}
          </ScrollView>
        </View>
      </Modal>

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
  hint: { fontSize: 15, lineHeight: 22 },
  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 16 },
  iconButton: { height: 48, width: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cameraButton: { minWidth: 76, minHeight: 54, borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 1 },
  cameraButtonText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  selectProductsButton: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  selectProductsText: { flex: 1, fontWeight: '700', fontSize: 16, lineHeight: 21 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  total: { fontSize: 20, fontWeight: '900' },
  cartRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  productCopy: { flex: 1, gap: 3 },
  productName: { fontSize: 15, fontWeight: '700' },
  quantity: { minWidth: 24, textAlign: 'center', fontWeight: '800' },
  price: { fontWeight: '900', fontSize: 16 },
  totalLabel: { fontSize: 15, fontWeight: '800' },
  discountHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8 },
  discountModes: { flexDirection: 'row', borderWidth: 1, borderRadius: 11, padding: 3 },
  discountMode: { minHeight: 38, minWidth: 94, paddingHorizontal: 9, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  discountModeText: { fontSize: 13, fontWeight: '800' },
  discountInput: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 16 },
  paymentLabel: { fontSize: 15, fontWeight: '800', marginTop: 6 },
  paymentOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentOption: { minHeight: 40, paddingHorizontal: 12, borderWidth: 1, borderRadius: 11, justifyContent: 'center' },
  modalScreen: { flex: 1, padding: 18 },
  modalHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quoteList: { paddingVertical: 12, gap: 10 },
  quoteOption: { minHeight: 68, padding: 14, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cameraScreen: { flex: 1, backgroundColor: '#000' },
  cameraOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'space-around', padding: 28 },
  cameraTitle: { color: '#fff', fontWeight: '800', fontSize: 18, textAlign: 'center', backgroundColor: '#0009', padding: 12, borderRadius: 12 },
  scanFrame: { width: '88%', height: 180, borderWidth: 3, borderColor: '#FACC15', borderRadius: 20 },
  closeCamera: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24 },
  closeCameraText: { color: '#111827', fontWeight: '800' },
});

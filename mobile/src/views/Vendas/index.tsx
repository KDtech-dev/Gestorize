import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import Nav from '@components/utilities/Nav';
import Button from '@components/botoes/Button';
import { getProdutos } from '@api/apiProdutos';
import { getProdutoPorCodigo, getVendas, registrarVenda, VendaType } from '@api/apiVendas';
import { ProdutoType } from '@context/types';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { can } from '@utils/permissions';
import Toast from 'react-native-toast-message';

type CarrinhoItem = { produto: ProdutoType; quantidade: number };
const moeda = (valor: number | string | null | undefined) => Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Vendas() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const podeCriar = can(user, 'vendas.criar');
  const [produtos, setProdutos] = useState<ProdutoType[]>([]);
  const [vendas, setVendas] = useState<VendaType[]>([]);
  const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
  const [busca, setBusca] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cameraVisivel, setCameraVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const processandoScan = useRef(false);

  const carregar = useCallback(async () => {
    try {
      const [produtosResponse, vendasResponse] = await Promise.all([getProdutos(), getVendas()]);
      setProdutos(produtosResponse.data ?? []);
      setVendas(vendasResponse.data ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Não foi possível carregar vendas e produtos.' });
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return produtos;
    return produtos.filter((produto) =>
      [produto.nome, produto.codigo_barras, produto.categoria_titulo]
        .some((campo) => campo?.toLocaleLowerCase('pt-BR').includes(termo)),
    );
  }, [busca, produtos]);

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
      await registrarVenda(carrinho.map(({ produto, quantidade }) => ({ produto_id: produto.id, quantidade })));
      Toast.show({ type: 'success', text1: 'Venda registrada', text2: 'O estoque foi atualizado.' });
      setCarrinho([]);
      await carregar();
    } catch (error: any) {
      const mensagem = error?.response?.data?.errors?.itens?.[0] ?? error?.response?.data?.message ?? 'Não foi possível concluir a venda.';
      Toast.show({ type: 'error', text1: 'Erro ao registrar venda', text2: mensagem });
    } finally {
      setSalvando(false);
    }
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
      <FlatList
        key={width >= 850 ? 'desktop-grid' : 'mobile-list'}
        numColumns={width >= 850 ? 2 : 1}
        data={filtrados}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, width >= 850 && styles.desktopContent]}
        ListHeaderComponent={
          <View>
            <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.heading, { color: colors.text }]}>Adicionar produtos</Text>
              <Text style={[styles.hint, { color: colors.muted }]}>Use a câmera, um leitor conectado ou pesquise pelo nome.</Text>
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
              <TextInput
                value={busca}
                onChangeText={setBusca}
                placeholder="Pesquisar produto pelo nome ou categoria"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.searchInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />
            </View>

            <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionRow}>
                <Text style={[styles.heading, { color: colors.text }]}>Carrinho ({carrinho.length})</Text>
                <Text style={[styles.total, { color: colors.primary }]}>{moeda(total)}</Text>
              </View>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Produtos disponíveis</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => adicionarProduto(item)} disabled={!podeCriar} style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: Number(item.estoque) > 0 ? 1 : 0.55 }]}>
            <View style={styles.productCopy}>
              <Text style={[styles.productName, { color: colors.text }]}>{item.nome}</Text>
              <Text style={[styles.hint, { color: colors.muted }]}>{item.categoria_titulo ?? 'Sem categoria'} · estoque {item.estoque}</Text>
            </View>
            <Text style={[styles.price, { color: colors.primary }]}>{moeda(item.preco_venda)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={[styles.hint, { color: colors.muted, textAlign: 'center' }]}>Nenhum produto encontrado.</Text>}
        ListFooterComponent={
          <View style={styles.history}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Vendas recentes</Text>
            {vendas.slice(0, 8).map((venda) => (
              <View key={venda.id} style={[styles.historyRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.productCopy}>
                  <Text style={[styles.productName, { color: colors.text }]}>{new Date(venda.vendido_em).toLocaleString('pt-BR')}</Text>
                  <Text style={[styles.hint, { color: colors.muted }]}>{venda.itens.reduce((sum, item) => sum + item.quantidade, 0)} unidades · {venda.vendedor ?? 'Equipe'}</Text>
                </View>
                <Text style={[styles.price, { color: colors.primary }]}>{moeda(venda.valor_total)}</Text>
              </View>
            ))}
          </View>
        }
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
  desktopContent: { width: '100%', maxWidth: 1120, alignSelf: 'center' },
  panel: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12, gap: 10 },
  heading: { fontSize: 18, fontWeight: '800' },
  hint: { fontSize: 13, lineHeight: 19 },
  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 14 },
  searchInput: { flex: undefined },
  iconButton: { height: 48, width: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  total: { fontSize: 20, fontWeight: '900' },
  cartRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  productCopy: { flex: 1, gap: 3 },
  productName: { fontSize: 15, fontWeight: '700' },
  quantity: { minWidth: 24, textAlign: 'center', fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 5, marginBottom: 10 },
  productCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  price: { fontWeight: '900', fontSize: 16 },
  history: { marginTop: 12 },
  historyRow: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', gap: 12, alignItems: 'center' },
  cameraScreen: { flex: 1, backgroundColor: '#000' },
  cameraOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'space-around', padding: 28 },
  cameraTitle: { color: '#fff', fontWeight: '800', fontSize: 18, textAlign: 'center', backgroundColor: '#0009', padding: 12, borderRadius: 12 },
  scanFrame: { width: '88%', height: 180, borderWidth: 3, borderColor: '#FACC15', borderRadius: 20 },
  closeCamera: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24 },
  closeCameraText: { color: '#111827', fontWeight: '800' },
});

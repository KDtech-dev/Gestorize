import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Produto from '@components/ui-lists/Produto';
import SearchBar from '@components/ui/SearchBar';
import TooltipChip from '@components/botoes/TooltipChip';
import { ProdutoType } from '@context/types';
import { useTheme } from '@context/ThemeContext';

type Props = {
  visible: boolean;
  products: ProdutoType[];
  selectedProductIds: string[];
  onSelect: (product: ProdutoType) => void;
  onClose: () => void;
};

export default function OrcamentoProdutoPicker({
  visible,
  products,
  selectedProductIds,
  onSelect,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setSearch('');
      setSelectedCategory(null);
    }
  }, [visible]);

  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    products.forEach((product) => {
      const id = product.categoria_id || 'sem-categoria';
      if (!unique.has(id)) unique.set(id, product.categoria_titulo || 'Sem categoria');
    });
    return [...unique].map(([id, label]) => ({ id, label }));
  }, [products]);

  const matchingProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');

    return products.filter((product) => {
      const categoryId = product.categoria_id || 'sem-categoria';
      const categoryMatches = !selectedCategory || selectedCategory === categoryId;
      const searchMatches = !term || [
        product.nome,
        product.descricao ?? '',
        product.categoria_titulo ?? '',
        product.fornecedor_razao_social ?? '',
      ].some((value) => value.toLocaleLowerCase('pt-BR').includes(term));
      return categoryMatches && searchMatches;
    });
  }, [products, search, selectedCategory]);
  const availableCount = matchingProducts.filter((product) => !selectedProductIds.includes(product.id)).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.background }]} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text style={[styles.title, { color: colors.text }]}>Adicionar produto</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>{availableCount} disponíveis · {matchingProducts.length - availableCount} já no orçamento</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <SearchBar placeholder="Busque por nome, categoria ou fornecedor" value={search} onChangeText={setSearch} />
          <FlatList
            horizontal
            data={[{ id: 'todas', label: 'Todas' }, ...categories]}
            keyExtractor={(category) => category.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
            renderItem={({ item: category }) => (
              <TooltipChip
                label={category.label}
                active={category.id === 'todas' ? selectedCategory === null : selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id === 'todas' ? null : category.id)}
              />
            )}
          />
          <FlatList
            data={matchingProducts}
            keyExtractor={(product) => product.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.products}
            ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>Nenhum produto encontrado.</Text>}
            renderItem={({ item: product }) => {
              const selected = selectedProductIds.includes(product.id);
              return <Produto
                  nome={product.nome}
                  preco={Number(product.preco_venda ?? 0)}
                  estoque={Number(product.estoque)}
                  unidade={product.unidade_medida_sigla}
                  categoria={product.categoria_titulo}
                  imagem={product.imagem_principal?.url ?? null}
                  selected={selected}
                  onPress={() => { if (!selected) onSelect(product); }}
                />;
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  sheet: { height: '88%', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 18, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginBottom: 10 },
  heading: { flex: 1 },
  title: { fontSize: 21, fontWeight: '900' },
  subtitle: { fontSize: 13, marginTop: 2 },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  filters: { paddingHorizontal: 12, gap: 8, paddingBottom: 8 },
  products: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 28 },
  empty: { fontSize: 14, textAlign: 'center', padding: 24 },
});

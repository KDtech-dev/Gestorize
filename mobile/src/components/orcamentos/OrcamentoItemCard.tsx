import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import EditableTextCard from '@components/EditableTextCard';
import { formatMoney } from '@core/utils/format';
import { ProdutoType } from '@context/types';

export type OrcamentoItemForm = {
  key: string;
  produto_id: string;
  quantidade: string;
  preco_unitario: number;
};

type Props = {
  item: OrcamentoItemForm;
  produto: ProdutoType;
  index: number;
  disabled?: boolean;
  onChangeQuantidade: (quantidade: string) => void;
  onRemove: () => void;
};

export default function OrcamentoItemCard({
  item,
  produto,
  index,
  disabled = false,
  onChangeQuantidade,
  onRemove,
}: Props) {
  const quantidade = Number(item.quantidade) || 0;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>
          {index + 1}. {produto.nome}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Remover ${produto.nome} do orçamento`}
          disabled={disabled}
          onPress={onRemove}
          style={styles.removeButton}
        >
          <Ionicons name="trash-outline" size={20} color="#C62828" />
        </TouchableOpacity>
      </View>

      <Text style={styles.details}>
        {produto.categoria_titulo ?? 'Sem categoria'} · Estoque: {Number(produto.estoque)} {produto.unidade_medida_sigla ?? 'un.'}
      </Text>

      <View style={styles.fields}>
        <EditableTextCard
          label="Quantidade"
          value={item.quantidade}
          tipo="number"
          placeholder="1"
          editable={!disabled}
          onChangeText={onChangeQuantidade}
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
        Subtotal: {formatMoney(quantidade * item.preco_unitario)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#D5DCE5', padding: 14, marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, color: '#062046', fontSize: 16, fontWeight: '800' },
  removeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FDECEC' },
  details: { color: '#64748B', fontSize: 13, marginTop: 4 },
  fields: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  subtotal: { color: '#334155', fontSize: 15, fontWeight: '700', textAlign: 'right', marginTop: 2 },
});

import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FornecedorCard from '@components/ui-lists/Fornecedor';
import SearchBar from '@components/ui/SearchBar';
import TooltipChip from '@components/botoes/TooltipChip';
import Button from '@components/botoes/Button';
import { FornecedorType } from '@context/types';
import { useTheme } from '@context/ThemeContext';

type Props = { visible: boolean; suppliers: FornecedorType[]; selectedId?: string; loading?: boolean; canAdd?: boolean; onSelect: (supplier: FornecedorType) => void; onAdd?: () => void; onClose: () => void };

export default function ProdutoFornecedorPicker({ visible, suppliers, selectedId, loading, canAdd, onSelect, onAdd, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const { colors } = useTheme();
  useEffect(() => { if (!visible) { setSearch(''); setSelectedBranch(null); } }, [visible]);
  const branches = useMemo(() => [...new Set(suppliers.map((s) => s.ramo_atividade).filter(Boolean))], [suppliers]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return suppliers.filter((s) => (!selectedBranch || s.ramo_atividade === selectedBranch) && (!term || [s.nome, s.email, s.telefone, s.cnpj, s.nome_responsavel, s.ramo_atividade].some((v) => (v ?? '').toLocaleLowerCase('pt-BR').includes(term))));
  }, [suppliers, search, selectedBranch]);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.overlay} onPress={onClose}><Pressable style={[styles.sheet, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
      <View style={styles.header}><View style={{ flex: 1 }}><Text style={[styles.title, { color: colors.text }]}>Selecionar fornecedor</Text><Text style={{ color: colors.muted }}>{loading ? 'Carregando fornecedores...' : `${filtered.length} fornecedores encontrados`}</Text></View><TouchableOpacity onPress={onClose} style={[styles.close, { backgroundColor: colors.surface }]}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity></View>
      <SearchBar placeholder="Busque por nome, ramo, e-mail ou CNPJ" value={search} onChangeText={setSearch} />
      <FlatList horizontal data={[{ id: 'all', name: 'Todos' }, ...branches.map((name) => ({ id: name, name }))]} keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} renderItem={({ item }) => <TooltipChip label={item.name} active={item.id === 'all' ? !selectedBranch : selectedBranch === item.name} onPress={() => setSelectedBranch(item.id === 'all' || selectedBranch === item.name ? null : item.name)} />} />
      <FlatList data={filtered} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: 'center', padding: 24 }}>{loading ? 'Carregando...' : 'Nenhum fornecedor encontrado.'}</Text>} renderItem={({ item }) => <FornecedorCard nome={item.nome} email={item.email} telefone={item.telefone} ramo_atividade={item.ramo_atividade} nome_responsavel={item.nome_responsavel} avatar={item.avatar_url} local={[item.endereco?.cidade, item.endereco?.estado].filter(Boolean).join(' - ')} selected={item.id === selectedId} onPress={() => onSelect(item)} /> } />
      {canAdd && onAdd && <View style={styles.add}><Button title="Cadastrar fornecedor" variant="outlined" onPress={onAdd} /></View>}
    </Pressable></Pressable>
  </Modal>;
}
const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' }, sheet: { height: '88%', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 18, overflow: 'hidden' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginBottom: 10 }, title: { fontSize: 21, fontWeight: '900' }, close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, filters: { paddingHorizontal: 12, gap: 8, paddingBottom: 8 }, list: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 16 }, add: { paddingHorizontal: 18, paddingBottom: 14 } });

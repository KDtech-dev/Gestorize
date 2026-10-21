import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Cliente from '@components/ui-lists/Cliente';
import SearchBar from '@components/ui/SearchBar';
import TooltipChip from '@components/botoes/TooltipChip';
import { ClienteType } from '@context/types';

type TipoFiltro = 'PF' | 'PJ' | null;
type Props = {
  visible: boolean;
  clients: ClienteType[];
  selectedClientId?: string | null;
  onSelect: (client: ClienteType) => void;
  onClose: () => void;
};

const tipos: { id: Exclude<TipoFiltro, null>; label: string }[] = [
  { id: 'PF', label: 'Pessoa física' },
  { id: 'PJ', label: 'Pessoa jurídica' },
];

export default function OrcamentoClientePicker({ visible, clients, selectedClientId, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<TipoFiltro>(null);

  useEffect(() => {
    if (!visible) {
      setSearch('');
      setSelectedType(null);
    }
  }, [visible]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return clients.filter((client) => {
      const typeMatches = !selectedType || client.tipo.toUpperCase() === selectedType;
      const searchMatches = !term || [client.nome, client.email ?? '', client.telefone ?? '']
        .some((value) => value.toLocaleLowerCase('pt-BR').includes(term));
      return typeMatches && searchMatches;
    });
  }, [clients, search, selectedType]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text style={styles.title}>Selecionar cliente</Text>
              <Text style={styles.subtitle}>{filteredClients.length} clientes encontrados</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#062046" />
            </TouchableOpacity>
          </View>

          <SearchBar placeholder="Busque por nome, e-mail ou telefone" value={search} onChangeText={setSearch} />
          <FlatList
            horizontal
            data={tipos}
            keyExtractor={(tipo) => tipo.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
            renderItem={({ item }) => (
              <TooltipChip
                label={item.label}
                active={selectedType === item.id}
                onPress={() => setSelectedType((current) => current === item.id ? null : item.id)}
              />
            )}
          />
          <FlatList
            data={filteredClients}
            keyExtractor={(client) => client.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.clients}
            ListEmptyComponent={<Text style={styles.empty}>Nenhum cliente encontrado.</Text>}
            renderItem={({ item }) => (
              <View style={item.id === selectedClientId ? styles.selected : undefined}>
                <Cliente
                  tipo={item.tipo.toUpperCase() as 'PF' | 'PJ'}
                  nome={item.nome}
                  email={item.email}
                  avatar={item.avatar_url}
                  estado={item.endereco?.estado}
                  onPress={() => onSelect(item)}
                />
              </View>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  sheet: { height: '88%', backgroundColor: '#F6F8FB', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 18, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginBottom: 10 },
  heading: { flex: 1 },
  title: { color: '#062046', fontSize: 21, fontWeight: '900' },
  subtitle: { color: '#64748B', fontSize: 13, marginTop: 2 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E7EDF5', alignItems: 'center', justifyContent: 'center' },
  filters: { paddingHorizontal: 12, gap: 8, paddingBottom: 8 },
  clients: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 28 },
  selected: { borderWidth: 3, borderColor: '#F2B705', borderRadius: 23, padding: 2, marginBottom: 10 },
  empty: { color: '#64748B', fontSize: 14, textAlign: 'center', padding: 24 },
});

import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Nav from '@components/utilities/Nav';
import SearchBar from '@components/ui/SearchBar';
import { RootStackParamList } from '@context/types';
import { useTheme } from '@context/ThemeContext';
import { getOrganizacoes, OrganizationType, updateOrganizacao } from '@api/apiOrganizacoes';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export default function Organizacoes() {
  const navigation = useNavigation<Navigation>();
  const { colors } = useTheme();
  const [organizations, setOrganizations] = useState<OrganizationType[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setOrganizations(await getOrganizacoes()); }
    catch { Toast.show({ type: 'error', text1: 'Não foi possível carregar as organizações.' }); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return organizations.filter((item) => {
      const manager = item.managers?.find((person) => person.id === item.manager_id) ?? item.managers?.[0];
      return !term || [item.name, item.document, item.email, manager?.name, manager?.email].some((value) => value?.toLocaleLowerCase('pt-BR').includes(term));
    });
  }, [organizations, search]);

  const toggle = async (item: OrganizationType) => {
    try { await updateOrganizacao(item.id, { active: !item.active }); await load(); }
    catch { Toast.show({ type: 'error', text1: 'Não foi possível atualizar a organização.' }); }
  };

  return <View style={[styles.container, { backgroundColor: colors.background }]}>
    <Nav title="Organizações" subtitle="Administração global" onBackPress={() => navigation.goBack()} rightType="add" onAddPress={() => navigation.navigate('OrganizacaoForm', { modo: 'criar' })} />
    <View style={styles.searchWrapper}><SearchBar value={search} onChangeText={setSearch} placeholder="Buscar organização ou gestor" /></View>
    {loading ? <ActivityIndicator style={styles.loading} color={colors.primary} /> : null}
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshing={loading}
      onRefresh={load}
      ListEmptyComponent={!loading ? <Text style={[styles.empty, { color: colors.muted }]}>{search ? 'Nenhuma organização encontrada.' : 'Nenhuma organização cadastrada.'}</Text> : null}
      renderItem={({ item }) => {
        const manager = item.managers?.find((person) => person.id === item.manager_id) ?? item.managers?.[0];
        return <Pressable onPress={() => navigation.navigate('OrganizacaoForm', { modo: 'editar', organizationId: item.id })} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
          <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}><MaterialCommunityIcons name="domain" size={24} color={colors.primary} /></View>
          <View style={styles.details}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{item.document || 'Sem CNPJ'} · {item.users_count} usuário(s)</Text>
            <View style={styles.managerLine}><MaterialCommunityIcons name="account-tie-outline" size={14} color={colors.muted} /><Text style={[styles.managerName, { color: colors.muted }]} numberOfLines={1}>{manager?.name ?? 'Gestor não cadastrado'}</Text></View>
            <Text style={[styles.status, { color: item.active ? '#15803D' : '#DC2626' }]}>{item.active ? 'Ativa' : 'Inativa'}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`${item.active ? 'Desativar' : 'Ativar'} ${item.name}`} hitSlop={8} onPress={(event) => { event.stopPropagation(); void toggle(item); }} style={styles.action}>
            <MaterialCommunityIcons name={item.active ? 'pause-circle-outline' : 'play-circle-outline'} size={25} color={colors.primary} />
          </Pressable>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
        </Pressable>;
      }}
    />
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, searchWrapper: { marginTop: 16 }, loading: { marginTop: 20 }, list: { paddingHorizontal: 14, paddingBottom: 30, gap: 10, flexGrow: 1 },
  card: { minHeight: 82, borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, details: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800' }, meta: { fontSize: 12, marginTop: 4 }, managerLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }, managerName: { fontSize: 12, flexShrink: 1 }, status: { fontSize: 11, fontWeight: '800', marginTop: 4 }, action: { padding: 4 },
  empty: { textAlign: 'center', padding: 24, fontSize: 14 },
});

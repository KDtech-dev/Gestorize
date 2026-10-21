import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Nav from '@components/utilities/Nav';
import SearchBar from '@components/ui/SearchBar';
import TooltipChip from '@components/botoes/TooltipChip';
import Orcamento from '@components/ui-lists/Orcamento';
import { useTheme } from '@context/ThemeContext';
import { OrcamentoType, RootStackParamList } from '@context/types';
import { getOrcamentos } from '@api/apiOrcamentos';
import Toast from 'react-native-toast-message';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Filtro = '24h' | '7d' | 'mes' | null;

const filtros: { id: Exclude<Filtro, null>; label: string }[] = [
  { id: '24h', label: 'Últimas 24h' },
  { id: '7d', label: 'Últimos 7 dias' },
  { id: 'mes', label: 'Este mês' },
];

const nomeCliente = (orcamento: OrcamentoType) =>
  orcamento.cliente?.nome ?? 'Cliente não informado';

const Orcamentos = () => {
  const navigation = useNavigation<Navigation>();
  const { colors } = useTheme();
  const [orcamentos, setOrcamentos] = useState<OrcamentoType[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFiltro, setSelectedFiltro] = useState<Filtro>(null);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const carregarOrcamentos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOrcamentos();
      setOrcamentos(response.data ?? []);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar orçamentos',
        text2: error?.response?.data?.message ?? 'Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregarOrcamentos(); }, [carregarOrcamentos]));

  const filteredData = useMemo(() => {
    const termo = search.trim().toLocaleLowerCase('pt-BR');
    const agora = new Date();

    return orcamentos.filter((item) => {
      const cliente = nomeCliente(item).toLocaleLowerCase('pt-BR');
      const titulo = item.titulo?.toLocaleLowerCase('pt-BR') ?? '';
      const id = item.id.toLocaleLowerCase('pt-BR');
      const correspondeBusca = !termo || titulo.includes(termo) || cliente.includes(termo) || id.includes(termo);
      const data = new Date(`${item.data_orcamento}T00:00:00`);
      let correspondeFiltro = true;

      if (selectedFiltro === '24h') {
        correspondeFiltro = !Number.isNaN(data.getTime()) && agora.getTime() - data.getTime() <= 86400000 && data <= agora;
      } else if (selectedFiltro === '7d') {
        correspondeFiltro = !Number.isNaN(data.getTime()) && agora.getTime() - data.getTime() <= 7 * 86400000 && data <= agora;
      } else if (selectedFiltro === 'mes') {
        correspondeFiltro = !Number.isNaN(data.getTime()) && data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
      }

      return correspondeBusca && correspondeFiltro;
    });
  }, [orcamentos, search, selectedFiltro]);

  const opacity = scrollY.interpolate({ inputRange: [0, 100], outputRange: [1, 0], extrapolate: 'clamp' });
  const headerTranslate = scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -120], extrapolate: 'clamp' });
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.setValue(event.nativeEvent.contentOffset.y);
  }, [scrollY]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Nav
        title="Orçamentos"
        subtitle={`${filteredData.length} de ${orcamentos.length} cadastrados`}
        onBackPress={() => navigation.goBack()}
        rightType="add"
        onAddPress={() => navigation.navigate('NovoOrcamento', { modo: 'criar' })}
      />

      <Animated.View pointerEvents="box-none" style={[styles.headerFilters, { transform: [{ translateY: headerTranslate }], opacity }]}>
        <SearchBar placeholder="Busque pelo cliente ou código" value={search} onChangeText={setSearch} />
        <View style={styles.filtersContainer}>
          <FlatList
            data={filtros}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.filtersContent}
            renderItem={({ item }) => (
              <TooltipChip
                label={item.label}
                active={selectedFiltro === item.id}
                onPress={() => setSelectedFiltro((atual) => atual === item.id ? null : item.id)}
              />
            )}
          />
        </View>
      </Animated.View>

      <Animated.FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={carregarOrcamentos}
        renderItem={({ item }) => (
          <Orcamento
            title={item.titulo || `Orçamento ${item.id.slice(0, 8)}`}
            cliente={nomeCliente(item)}
            valor={Number(item.valor_total ?? 0)}
            onPress={() => navigation.navigate('NovoOrcamento', { modo: 'editar', orcamentoId: item.id })}
          />
        )}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
};

export default Orcamentos;

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerFilters: { position: 'absolute', top: 140, left: 0, right: 0, marginTop: 12, zIndex: 10 },
  filtersContainer: { marginTop: 10 },
  filtersContent: { paddingHorizontal: 10, gap: 8 },
  listContent: { padding: 10, paddingTop: 135 },
});

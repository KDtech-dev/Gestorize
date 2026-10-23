import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Nav from '@components/utilities/Nav';
import SearchBar from '@components/ui/SearchBar';
import AnimatedListHeader from '@components/ui/AnimatedListHeader';
import TooltipChip from '@components/botoes/TooltipChip';
import Produto from '@components/ui-lists/Produto';

import { useTheme } from '@context/ThemeContext';
import { ProdutoType, RootStackParamList } from '@context/types';
import { getProdutos } from '@api/apiProdutos';

import Toast from 'react-native-toast-message';
import { useAuth } from '@context/AuthContext';
import { can } from '@utils/permissions';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const PAGE_SIZE = 10;

const Produtos = () => {
    const navigation = useNavigation<Navigation>();
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const podeCriar = can(user, 'produtos.criar');

    const [produtos, setProdutos] = useState<ProdutoType[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const [selectedFiltro, setSelectedFiltro] = useState<
        'estoque' | 'sem_estoque' | null
    >(null);
    const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
    const [selectedValidade, setSelectedValidade] = useState<'vencidos' | 'em_dia' | 'sem_validade' | null>(null);

    const scrollY = useRef(new Animated.Value(0)).current;

    const carregarProdutos = useCallback(async () => {
        try {
            setLoading(true);

            const response = await getProdutos();

            setProdutos(response.data);
            setVisibleCount(PAGE_SIZE);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Erro ao carregar produtos',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            carregarProdutos();
        }, [carregarProdutos]),
    );

    const filteredData = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        const agora = new Date();
        const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;

        return produtos.filter((item) => {
            const matchSearch =
                !normalizedSearch ||
                item.nome.toLowerCase().includes(normalizedSearch) ||
                item.descricao?.toLowerCase().includes(normalizedSearch) ||
                item.categoria_titulo
                    ?.toLowerCase()
                    .includes(normalizedSearch) ||
                item.fornecedor_razao_social
                    ?.toLowerCase()
                    .includes(normalizedSearch);

            const matchEstoque =
                selectedFiltro === null
                    ? true
                    : selectedFiltro === 'estoque'
                        ? Number(item.estoque) > 0
                        : Number(item.estoque) <= 0;

            const categoriaProduto = item.categoria_titulo?.trim() || 'Sem categoria';
            const matchCategoria = !selectedCategoria || categoriaProduto === selectedCategoria;
            const validade = item.validade?.slice(0, 10) || null;
            const matchValidade = selectedValidade === null
                ? true
                : selectedValidade === 'sem_validade'
                    ? !validade
                    : selectedValidade === 'vencidos'
                        ? Boolean(validade && validade < hoje)
                        : Boolean(validade && validade >= hoje);

            return matchSearch && matchEstoque && matchCategoria && matchValidade;
        });
    }, [produtos, search, selectedFiltro, selectedCategoria, selectedValidade]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [search, selectedFiltro, selectedCategoria, selectedValidade]);

    const visibleData = useMemo(
        () => filteredData.slice(0, visibleCount),
        [filteredData, visibleCount],
    );

    const carregarMais = useCallback(() => {
        setVisibleCount((atual) => Math.min(atual + PAGE_SIZE, filteredData.length));
    }, [filteredData.length]);

    const categorias = useMemo(
        () => [...new Set(produtos.map((item) => item.categoria_titulo?.trim() || 'Sem categoria'))]
            .sort((a, b) => a.localeCompare(b, 'pt-BR')),
        [produtos],
    );

    const handleScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            scrollY.setValue(event.nativeEvent.contentOffset.y);
        },
        [scrollY],
    );

    const handleFiltroPress = useCallback(
        (filtro: 'estoque' | 'sem_estoque') => {
            setSelectedFiltro((previous) =>
                previous === filtro ? null : filtro,
            );
        },
        [],
    );

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.background,
                },
            ]}
        >
            <Nav
                title="Produtos"
                subtitle={`${filteredData.length} de ${produtos.length} cadastrados`}
                onBackPress={() => navigation.goBack()}
                rightType={podeCriar ? "add" : "menu"}
                onAddPress={() =>
                    navigation.navigate('NovoProduto', {
                        modo: 'criar',
                    })
                }
            />

            <AnimatedListHeader scrollY={scrollY} marginTop={8}>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Abrir Central de Impressão de Etiquetas"
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate('CentralEtiquetas')}
                    style={[styles.labelsAccess, { backgroundColor: isDark ? '#2563EB' : colors.primary }]}
                >
                    <View style={styles.labelsIcon}>
                        <MaterialCommunityIcons name="tag-multiple-outline" size={22} color="#fff" />
                    </View>
                    <View style={styles.labelsCopy}>
                        <Text style={styles.labelsTitle}>Central de etiquetas</Text>
                        <Text style={styles.labelsSubtitle}>Gerar e acompanhar impressões</Text>
                    </View>
                    <View style={styles.labelsAction}>
                        <Text style={styles.labelsActionText}>Abrir</Text>
                        <MaterialCommunityIcons name="arrow-right" size={17} color="#fff" />
                    </View>
                </TouchableOpacity>

                <SearchBar
                    placeholder="Busque por nome, categoria ou fornecedor"
                    value={search}
                    onChangeText={setSearch}
                />

                <View style={styles.filtersContainer}>
                    <Text style={[styles.filterLabel, { color: colors.muted }]}>Estoque</Text>
                    <FlatList
                        data={[
                            {
                                id: 'estoque',
                                label: 'Com estoque',
                            },
                            {
                                id: 'sem_estoque',
                                label: 'Sem estoque',
                            },
                        ]}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.filtersContent}
                        renderItem={({ item }) => {
                            const isActive =
                                selectedFiltro === item.id;

                            return (
                                <TooltipChip
                                    label={item.label}
                                    active={isActive}
                                    onPress={() =>
                                        handleFiltroPress(
                                            item.id as
                                            | 'estoque'
                                            | 'sem_estoque',
                                        )
                                    }
                                />
                            );
                        }}
                    />
                </View>
                <View style={styles.filtersContainer}>
                    <Text style={[styles.filterLabel, { color: colors.muted }]}>Validade</Text>
                    <FlatList
                        data={[
                            { id: 'todas', label: 'Todas' },
                            { id: 'vencidos', label: 'Já venceu' },
                            { id: 'em_dia', label: 'Em dia' },
                            { id: 'sem_validade', label: 'Sem validade' },
                        ]}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.filtersContent}
                        renderItem={({ item }) => (
                            <TooltipChip
                                label={item.label}
                                active={item.id === 'todas' ? selectedValidade === null : selectedValidade === item.id}
                                onPress={() => setSelectedValidade(item.id === 'todas' || selectedValidade === item.id ? null : item.id as 'vencidos' | 'em_dia' | 'sem_validade')}
                            />
                        )}
                    />
                </View>
                <View style={styles.filtersContainer}>
                    <Text style={[styles.filterLabel, { color: colors.muted }]}>Categorias</Text>
                    <FlatList
                        data={[{ id: 'todas', label: 'Todas' }, ...categorias.map((categoria) => ({ id: categoria, label: categoria }))]}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.filtersContent}
                        renderItem={({ item }) => (
                            <TooltipChip
                                label={item.label}
                                active={item.id === 'todas' ? selectedCategoria === null : selectedCategoria === item.id}
                                onPress={() => setSelectedCategoria((current) => item.id === 'todas' || current === item.id ? null : item.id)}
                            />
                        )}
                    />
                </View>
            </AnimatedListHeader>

            <Animated.FlatList
                data={visibleData}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={carregarProdutos}
                renderItem={({ item }) => (
                    <Produto
                        nome={item.nome}
                        preco={item.preco_venda}
                        estoque={item.estoque}
                        unidade={item.unidade_medida_sigla}
                        categoria={item.categoria_titulo}
                        validade={item.validade}
                        imagem={item.imagem_principal?.url ?? null}
                        onPress={() =>
                            navigation.navigate('NovoProduto', {
                                modo: 'editar',
                                produtoId: item.id,
                            })
                        }
                    />
                )}
                onScroll={handleScroll}
                onEndReached={carregarMais}
                onEndReachedThreshold={0.45}
                scrollEventThrottle={16}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews
            />
        </View>
    );
};

export default Produtos;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    filtersContainer: {
        marginTop: 10,
    },

    filterLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginHorizontal: 12,
        marginBottom: 6,
    },

    filtersContent: {
        paddingHorizontal: 10,
        gap: 8,
    },

    listContent: {
        padding: 10,
        paddingTop: 352,
    },
    labelsAccess: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12, marginBottom: 8, paddingHorizontal: 15, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    labelsIcon: { width: 30, alignItems: 'center', justifyContent: 'center' },
    labelsCopy: { flex: 1, minWidth: 0, gap: 2 },
    labelsTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
    labelsSubtitle: { color: '#ffffffd9', fontSize: 11 },
    labelsAction: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    labelsActionText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});

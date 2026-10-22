import { useCallback, useMemo, useRef, useState } from 'react';
import {
    Animated,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Nav from '@components/utilities/Nav';
import SearchBar from '@components/ui/SearchBar';
import TooltipChip from '@components/botoes/TooltipChip';
import Produto from '@components/ui-lists/Produto';

import { useTheme } from '@context/ThemeContext';
import { ProdutoType, RootStackParamList } from '@context/types';
import { getProdutos } from '@api/apiProdutos';

import Toast from 'react-native-toast-message';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const Produtos = () => {
    const navigation = useNavigation<Navigation>();
    const { colors } = useTheme();

    const [produtos, setProdutos] = useState<ProdutoType[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const [selectedFiltro, setSelectedFiltro] = useState<
        'estoque' | 'sem_estoque' | null
    >(null);
    const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);

    const scrollY = useRef(new Animated.Value(0)).current;

    const carregarProdutos = useCallback(async () => {
        try {
            setLoading(true);

            const response = await getProdutos();

            setProdutos(response.data);
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

            return matchSearch && matchEstoque && matchCategoria;
        });
    }, [produtos, search, selectedFiltro, selectedCategoria]);

    const categorias = useMemo(
        () => [...new Set(produtos.map((item) => item.categoria_titulo?.trim() || 'Sem categoria'))]
            .sort((a, b) => a.localeCompare(b, 'pt-BR')),
        [produtos],
    );

    const opacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const headerTranslate = scrollY.interpolate({
        inputRange: [0, 120],
        outputRange: [0, -120],
        extrapolate: 'clamp',
    });

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
                rightType="add"
                onAddPress={() =>
                    navigation.navigate('NovoProduto', {
                        modo: 'criar',
                    })
                }
            />

            <Animated.View
                pointerEvents="box-none"
                style={[
                    styles.headerFilters,
                    {
                        transform: [{ translateY: headerTranslate }],
                        opacity,
                    },
                ]}
            >
                <SearchBar
                    placeholder="Busque por nome, categoria ou fornecedor"
                    value={search}
                    onChangeText={setSearch}
                />

                <View style={styles.filtersContainer}>
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
            </Animated.View>

            <Animated.FlatList
                data={filteredData}
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

    headerFilters: {
        position: 'absolute',
        top: 140,
        left: 0,
        right: 0,
        marginTop: 12,
        zIndex: 10,
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
        paddingTop: 205,
    },
});

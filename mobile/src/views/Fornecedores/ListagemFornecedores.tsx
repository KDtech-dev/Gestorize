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
import Fornecedor from '@components/ui-lists/Fornecedor';
import TooltipChip from '@components/botoes/TooltipChip';

import { useTheme } from '@context/ThemeContext';
import { FornecedorType, RootStackParamList } from '@context/types';
import { getFornecedores } from '@api/apiFornecedores';

import Toast from 'react-native-toast-message';
import { useAuth } from '@context/AuthContext';
import { can } from '@utils/permissions';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type OrdemAlfabetica = 'asc' | 'desc';

const Fornecedores = () => {
    const navigation = useNavigation<Navigation>();
    const { colors } = useTheme();
    const { user } = useAuth();
    const podeCriar = can(user, 'fornecedores.criar');

    const [fornecedores, setFornecedores] = useState<FornecedorType[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const [ordemAlfabetica, setOrdemAlfabetica] = useState<'asc' | 'desc'>('asc');
    const [ramoSelecionado, setRamoSelecionado] = useState<string | null>(null);

    const scrollY = useRef(new Animated.Value(0)).current;

    const carregarFornecedores = useCallback(async () => {
        try {
            setLoading(true);

            const response = await getFornecedores();

            setFornecedores(response.data);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Erro ao carregar fornecedores',
                text2: 'Não foi possível carregar a lista.',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            carregarFornecedores();
        }, [carregarFornecedores]),
    );

    /**
     * Extrai os ramos de atividade cadastrados,
     * removendo valores vazios e duplicados.
     */
    const ramosAtividade = useMemo(() => {
        const contagem = fornecedores.reduce<Record<string, number>>(
            (acc, fornecedor) => {
                const ramo = fornecedor.ramo_atividade?.trim();

                if (ramo) {
                    acc[ramo] = (acc[ramo] ?? 0) + 1;
                }

                return acc;
            },
            {}
        );

        return Object.entries(contagem)
            .sort(([ramoA, quantidadeA], [ramoB, quantidadeB]) => {
                const diferenca = quantidadeB - quantidadeA;

                return diferenca !== 0
                    ? diferenca
                    : ramoA.localeCompare(ramoB, 'pt-BR');
            })
            .slice(0, 4)
            .map(([ramo]) => ramo);
    }, [fornecedores]);

    /**
     * Aplica a busca, o filtro de ramo e a ordenação alfabética.
     */
    const filteredData = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        const normalizedNumbers = search.replace(/\D/g, '');

        return fornecedores
            .filter((item) => {
                // Filtro por ramo de atividade
                const matchRamoSelecionado = ramoSelecionado
                    ? item.ramo_atividade?.trim() === ramoSelecionado
                    : true;

                if (!matchRamoSelecionado) {
                    return false;
                }

                // Sem pesquisa, mantém os demais filtros
                if (!normalizedSearch) {
                    return true;
                }

                const matchNome = item.nome
                    .toLowerCase()
                    .includes(normalizedSearch);

                const matchEmail = item.email
                    ?.toLowerCase()
                    .includes(normalizedSearch);

                const matchCnpj =
                    normalizedNumbers.length > 0 &&
                    item.cnpj
                        .replace(/\D/g, '')
                        .includes(normalizedNumbers);

                const matchRamo = item.ramo_atividade
                    ?.toLowerCase()
                    .includes(normalizedSearch);

                const matchResponsavel = item.nome_responsavel
                    ?.toLowerCase()
                    .includes(normalizedSearch);

                return (
                    matchNome ||
                    matchEmail ||
                    matchCnpj ||
                    matchRamo ||
                    matchResponsavel
                );
            })
            .sort((a, b) => {
                const comparacao = a.nome.localeCompare(
                    b.nome,
                    'pt-BR',
                    { sensitivity: 'base' },
                );

                return ordemAlfabetica === 'asc'
                    ? comparacao
                    : -comparacao;
            });
    }, [fornecedores, search, ramoSelecionado, ordemAlfabetica]);

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

    const alternarOrdemAlfabetica = useCallback(() => {
        setOrdemAlfabetica((atual) =>
            atual === 'asc' ? 'desc' : 'asc',
        );
    }, []);

    const handleRamoPress = useCallback((ramo: string) => {
        setRamoSelecionado((atual) =>
            atual === ramo ? null : ramo,
        );
    }, []);

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
                title="Fornecedores"
                subtitle={`${filteredData.length} de ${fornecedores.length} cadastrados`}
                onBackPress={() => navigation.goBack()}
                rightType={podeCriar ? "add" : "menu"}
                onAddPress={() =>
                    navigation.navigate('NovoFornecedor', {
                        modo: 'criar',
                    })
                }
            />

            <Animated.View
                style={[
                    styles.headerFilters,
                    {
                        transform: [{ translateY: headerTranslate }],
                        opacity: opacity,
                    },
                ]}
            >
                <SearchBar
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Buscar fornecedor..."
                />

                <FlatList
                    horizontal
                    data={ramosAtividade}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContent}
                    ListHeaderComponent={
                        <TooltipChip
                            label={ordemAlfabetica === 'asc' ? 'Nome: A–Z' : 'Nome: Z–A'}
                            active={false}
                            onPress={() =>
                                setOrdemAlfabetica((atual) =>
                                    atual === 'asc' ? 'desc' : 'asc'
                                )
                            }
                        />
                    }
                    renderItem={({ item }) => (
                        <TooltipChip
                            label={item}
                            active={ramoSelecionado === item}
                            onPress={() =>
                                setRamoSelecionado((atual) =>
                                    atual === item ? null : item
                                )
                            }
                        />
                    )}
                    ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
                />
            </Animated.View>

            <Animated.FlatList
                data={filteredData}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={carregarFornecedores}
                renderItem={({ item }) => (
                    <Fornecedor
                        nome={item.nome}
                        email={item.email}
                        telefone={item.telefone}
                        ramo_atividade={item.ramo_atividade}
                        nome_responsavel={item.nome_responsavel}
                        avatar={item.avatar_url}
                        onPress={() =>
                            navigation.navigate('NovoFornecedor', {
                                modo: 'editar',
                                fornecedorId: item.id,
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

export default Fornecedores;

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

    filtersContent: {
        paddingHorizontal: 10,
        gap: 8,
    },

    listContent: {
        padding: 10,
        paddingTop: 135,
    },

});

import {
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    Animated,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    View,
} from 'react-native';

import {
    useFocusEffect,
    useNavigation,
} from '@react-navigation/native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Nav from '@components/utilities/Nav';
import SearchBar from '@components/ui/SearchBar';
import TooltipChip from '@components/botoes/TooltipChip';
import Funcionario from '@components/ui-lists/Funcionario';

import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { FuncionarioType, RootStackParamList } from '@context/types';

import { getFuncionarios } from '@api/apiFuncionario';

import Toast from 'react-native-toast-message';
import { can } from '@utils/permissions';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type PerfilFuncionario = 'gestor' | 'funcionario';


const perfisFuncionario = [
    {
        id: 'gestor',
        label: 'Gestores',
    },
    {
        id: 'funcionario',
        label: 'Funcionários',
    },
] as const;

const Funcionarios = () => {
    const navigation = useNavigation<Navigation>();

    const { colors } = useTheme();
    const { user } = useAuth();
    const podeCriar = can(user, 'users.criar');

    const [funcionarios, setFuncionarios] = useState<FuncionarioType[]>([]);

    const [selectedPerfil, setSelectedPerfil] =
        useState<PerfilFuncionario | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollY = useRef(new Animated.Value(0)).current;
    const carregarFuncionarios = useCallback(async () => {
        try {
            setLoading(true);

            const response = await getFuncionarios();

            setFuncionarios(response.data.filter((funcionario) =>
                String(funcionario.id) !== String(user?.id)
            ));
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Erro ao carregar funcionários',
                text2:
                    error?.response?.data?.message ??
                    'Não foi possível carregar a lista de funcionários.',
            });
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            carregarFuncionarios();
        }, [carregarFuncionarios]),
    );

    const filteredData = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return funcionarios.filter((item) => {
            const nomePerfil = item.role?.toLowerCase() ?? '';

            const matchPerfil = selectedPerfil
                ? nomePerfil === selectedPerfil
                : true;

            const nome = item.nome ?? '';
            const email = item.email ?? '';
            const cpf = item.cpf ?? '';

            const matchSearch =
                !normalizedSearch ||
                nome.toLowerCase().includes(normalizedSearch) ||
                email.toLowerCase().includes(normalizedSearch) ||
                cpf.toLowerCase().includes(normalizedSearch);

            return matchPerfil && matchSearch;
        });
    }, [funcionarios, search, selectedPerfil]);

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

    const handlePerfilPress = useCallback(
        (perfil: PerfilFuncionario) => {
            setSelectedPerfil((previous) =>
                previous === perfil ? null : perfil,
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
                title="Funcionários"
                subtitle={`${filteredData.length} de ${funcionarios.length} cadastrados`}
                onBackPress={() => navigation.goBack()}
                rightType={podeCriar ? "add" : "menu"}
                onAddPress={() =>
                    navigation.navigate('NovoFuncionario', {
                        modo: 'criar',
                    })
                }
            />

            <Animated.View
                pointerEvents="box-none"
                style={[
                    styles.headerFilters,
                    {
                        transform: [
                            {
                                translateY: headerTranslate,
                            },
                        ],
                        opacity,
                    },
                ]}
            >
                <SearchBar
                    placeholder="Busque por nome ou e-mail"
                    value={search}
                    onChangeText={setSearch}
                />

                <View style={styles.filtersContainer}>
                    <FlatList
                        data={perfisFuncionario}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.filtersContent}
                        renderItem={({ item }) => {
                            const isActive = selectedPerfil === item.id;

                            return (
                                <TooltipChip
                                    label={item.label}
                                    active={isActive}
                                    onPress={() =>
                                        handlePerfilPress(item.id)
                                    }
                                />
                            );
                        }}
                    />
                </View>
            </Animated.View>

            <Animated.FlatList
                data={filteredData}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={carregarFuncionarios}
                renderItem={({ item }) => {
                    const role = item.role?.toLowerCase();

                    const isGestor = role === 'gestor';

                    const roleLabel =
                        role === 'admin' || role === 'administrador'
                            ? 'Administrador'
                            : isGestor
                                ? 'Gestor'
                                : 'Funcionario';

                    return (
                        <Funcionario
                            nome={item.nome}
                            email={item.email}
                            role={roleLabel}
                            avatar={item.avatar_url}
                            onPress={() =>
                                navigation.navigate('NovoFuncionario', {
                                    modo: 'editar',
                                    funcionarioId: item.id,
                                })
                            }
                        />
                    );
                }}
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

export default Funcionarios;

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

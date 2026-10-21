import { getPermissoes } from "@api/apiAcessos";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import Toast from "react-native-toast-message";

import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { PermissaoType } from "@context/types";

type ModalPermissoesProps = {
    visible: boolean;
    selecionadas: string[];
    herdadas?: string[];
    onChange: (permissoes: string[]) => void;
    onClose: () => void;
};

export default function ModalPermissoes({
    visible,
    selecionadas,
    herdadas,
    onChange,
    onClose,
}: ModalPermissoesProps) {
    const [permissoesDisponiveis, setPermissoesDisponiveis] =
        useState<PermissaoType[]>([]);
    const estaAtiva = (id: string) =>
        herdadas?.includes(id) || selecionadas.includes(id);


    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (!visible) {
            return;
        }

        let ativo = true;

        const carregarPermissoes = async () => {
            try {
                setLoading(true);
                setPermissoesDisponiveis([]);

                const response = await getPermissoes();

                const permissoes: PermissaoType[] = Array.isArray(
                    response?.data
                )
                    ? response.data
                    : [];

                permissoes.sort((a, b) =>
                    a.grupo.localeCompare(b.grupo, "pt-BR") ||
                    a.nome.localeCompare(b.nome, "pt-BR")
                );

                if (ativo) {
                    setPermissoesDisponiveis(permissoes);
                }
            } catch (error: any) {
                if (ativo) {
                    Toast.show({
                        type: "error",
                        text1: "Erro ao carregar permissões",
                        text2:
                            error?.response?.data?.message ??
                            "Não foi possível consultar as permissões disponíveis.",
                    });
                }
            } finally {
                if (ativo) {
                    setLoading(false);
                }
            }
        };

        carregarPermissoes();

        return () => {
            ativo = false;
        };
    }, [visible]);

    const grupos = useMemo(() => {
        return permissoesDisponiveis.reduce<
            Record<string, PermissaoType[]>
        >((acc, permissao) => {
            const grupo = permissao.grupo || "Outros";

            if (!acc[grupo]) {
                acc[grupo] = [];
            }

            acc[grupo].push(permissao);

            return acc;
        }, {});

    }, [permissoesDisponiveis]);

    const alternarPermissao = (id: string) => {
        if (herdadas?.includes(id)) return;

        onChange(
            selecionadas.includes(id)
                ? selecionadas.filter((item) => item !== id)
                : [...selecionadas, id]
        );
    };

    const alternarGrupo = (permissoesGrupo: PermissaoType[]) => {
        const editaveis = permissoesGrupo
            .map((p) => p.id)
            .filter((id) => !herdadas?.includes(id));

        if (editaveis.length === 0) return;

        const todasMarcadas = editaveis.every((id) => selecionadas.includes(id));

        onChange(
            todasMarcadas
                ? selecionadas.filter((id) => !editaveis.includes(id))
                : [...new Set([...selecionadas, ...editaveis])]
        );
    };



    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={styles.overlay}
                onPress={onClose}
            >
                <Pressable
                    style={styles.modal}
                    onPress={(event) => event.stopPropagation()}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            Permissões
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Ionicons
                                name="close"
                                size={24}
                                color="#062046"
                            />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator
                                size="large"
                                color="#062046"
                            />

                            <Text style={styles.loadingText}>
                                Carregando permissões...
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.list}
                            keyboardShouldPersistTaps="handled"
                        >
                            {Object.entries(grupos).map(([grupo, permissoesGrupo]) => {
                                const idsGrupo = permissoesGrupo.map(
                                    (permissao) => permissao.id
                                );

                                const quantidadeSelecionada = idsGrupo.filter(estaAtiva).length;

                                const todasSelecionadas =
                                    idsGrupo.length > 0 &&
                                    quantidadeSelecionada === idsGrupo.length;

                                const parcialmenteSelecionadas =
                                    quantidadeSelecionada > 0 && !todasSelecionadas;
                                const editaveisGrupo = idsGrupo.filter((id) => !herdadas?.includes(id));
                                const grupoTravado = editaveisGrupo.length === 0;
                                const todasEditaveisMarcadas =
                                    !grupoTravado && editaveisGrupo.every((id) => selecionadas.includes(id));

                                return (
                                    <View key={grupo} style={styles.group}>

                                        <TouchableOpacity
                                            disabled={grupoTravado}
                                            style={[styles.groupHeader, grupoTravado && { opacity: 0.7 }]}
                                            onPress={() => alternarGrupo(permissoesGrupo)}
                                        >
                                            <Ionicons
                                                name={
                                                    todasSelecionadas
                                                        ? "checkbox"
                                                        : parcialmenteSelecionadas
                                                            ? "remove-circle"
                                                            : "square-outline"
                                                }
                                                size={23}
                                                color={
                                                    todasSelecionadas ||
                                                        parcialmenteSelecionadas
                                                        ? "#062046"
                                                        : "#777"
                                                }
                                            />

                                            <View style={styles.groupInfo}>
                                                <Text style={styles.groupTitle}>
                                                    {grupo}
                                                </Text>

                                                <Text style={styles.groupCount}>
                                                    {quantidadeSelecionada} de{" "}
                                                    {permissoesGrupo.length} selecionadas
                                                </Text>
                                            </View>
                                            <Text style={styles.groupAction}>
                                                {grupoTravado
                                                    ? "Herdadas do perfil"
                                                    : todasEditaveisMarcadas
                                                        ? "Desmarcar"
                                                        : "Selecionar todas"}
                                            </Text>
                                        </TouchableOpacity>

                                        {permissoesGrupo.map((permissao, index) => {
                                            const selecionada = estaAtiva(permissao.id);
                                            const herdada = !!herdadas?.includes(permissao.id);

                                            return (
                                                <View key={permissao.id}>
                                                    <TouchableOpacity
                                                        activeOpacity={herdada ? 1 : 0.7}
                                                        disabled={herdada}
                                                        style={[
                                                            styles.option,
                                                            selecionada && styles.selectedOption,
                                                            herdada && { opacity: 0.75 },
                                                        ]}
                                                        onPress={() => alternarPermissao(permissao.id)}
                                                    >
                                                        <View style={{ flex: 1 }}>
                                                            <Text
                                                                style={[
                                                                    styles.optionText,
                                                                    selecionada && styles.selectedOptionText,
                                                                ]}
                                                            >
                                                                {permissao.nome}
                                                            </Text>

                                                            {herdada && (
                                                                <Text
                                                                    style={[
                                                                        styles.inheritedText,
                                                                        selecionada && styles.selectedInheritedText,
                                                                    ]}
                                                                >
                                                                    Herdada do perfil
                                                                </Text>
                                                            )}
                                                        </View>

                                                        <Ionicons
                                                            name={herdada ? "lock-closed" : selecionada ? "checkbox" : "square-outline"}
                                                            size={22}
                                                            color={selecionada ? "#fff" : "#777"}
                                                        />
                                                    </TouchableOpacity>

                                                    {index <
                                                        permissoesGrupo.length - 1 && (
                                                            <View style={styles.divider} />
                                                        )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            })}

                            {permissoesDisponiveis.length === 0 && !loading && (
                                <View style={styles.empty}>
                                    <Text style={styles.emptyText}>
                                        Nenhuma permissão disponível.
                                    </Text>
                                </View>
                            )}

                            {permissoesDisponiveis.length === 0 && (
                                <View style={styles.empty}>
                                    <Text style={styles.emptyText}>
                                        Nenhuma permissão disponível.
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    )}

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.confirmButton}
                        onPress={onClose}
                    >
                        <Text style={styles.confirmButtonText}>
                            Confirmar seleção
                        </Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    modal: {
        width: "100%",
        maxWidth: 400,
        maxHeight: "85%",
        backgroundColor: "#fff",
        borderRadius: 20,
        overflow: "hidden",
    },

    header: {
        minHeight: 68,
        backgroundColor: "#062046",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 18,
    },

    title: {
        flex: 1,
        fontSize: 21,
        fontWeight: "500",
        color: "#fff",
        textAlign: "center",
    },

    closeButton: {
        position: "absolute",
        right: 18,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },

    list: {
        flexGrow: 0,
        flexShrink: 1,
    },

    option: {
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 12,
    },

    selectedOption: {
        backgroundColor: "#062046",
    },
    inheritedText: {
        fontSize: 11,
        color: "#667085",
        marginTop: 1,
    },

    selectedInheritedText: {
        color: "#CDD9F1",
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        color: "#111",
        fontWeight: "600",
    },

    selectedOptionText: {
        color: "#fff",
    },

    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "#D9D9D9",
        marginHorizontal: 20,
    },

    loadingContainer: {
        minHeight: 160,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },

    loadingText: {
        color: "#555",
        fontSize: 14,
    },

    empty: {
        minHeight: 100,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },

    emptyText: {
        fontSize: 15,
        color: "#777",
        textAlign: "center",
    },

    confirmButton: {
        margin: 14,
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: "#062046",
        alignItems: "center",
        justifyContent: "center",
    },

    confirmButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
    group: {
        marginHorizontal: 12,
        marginTop: 12,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: "#D9E0E8",
        borderRadius: 12,
        overflow: "hidden",
    },

    groupHeader: {
        minHeight: 68,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#F0F4F9",
    },

    groupInfo: {
        flex: 1,
    },

    groupTitle: {
        color: "#062046",
        fontSize: 16,
        fontWeight: "700",
    },

    groupCount: {
        marginTop: 3,
        color: "#667085",
        fontSize: 12,
    },

    groupAction: {
        color: "#062046",
        fontSize: 12,
        fontWeight: "600",
    },
});
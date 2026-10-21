import React, { useState } from "react";
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@context/ThemeContext";

export type ImagemGaleria = {
    id: string;
    uri: string;
    principal: boolean;
    nova: boolean;
};

type GaleriaImagensProps = {
    imagens: ImagemGaleria[];
    onChange: (imagens: ImagemGaleria[]) => void;
    editable?: boolean;
    maxImagens?: number;
};

export default function GaleriaImagens({
    imagens,
    onChange,
    editable = true,
    maxImagens = 10,
}: GaleriaImagensProps) {
    const { colors } = useTheme();
    const [imagemExpandida, setImagemExpandida] = useState<ImagemGaleria | null>(null);
    const selecionarImagens = async () => {
        if (!editable || imagens.length >= maxImagens) {
            return;
        }

        const permissao =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissao.granted) {
            return;
        }

        const resultado =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsMultipleSelection: true,
                selectionLimit: maxImagens - imagens.length,
                quality: 0.8,
            });

        if (resultado.canceled) {
            return;
        }

        const novasImagens: ImagemGaleria[] =
            resultado.assets.map((asset, index) => ({
                id: `nova-${Date.now()}-${index}`,
                uri: asset.uri,
                principal: imagens.length === 0 && index === 0,
                nova: true,
            }));


        const combinadas = [
            ...imagens,
            ...novasImagens,
        ].slice(0, maxImagens);

        if (!combinadas.some((imagem) => imagem.principal)) {
            onChange(
                combinadas.map((imagem, index) => ({
                    ...imagem,
                    principal: index === 0,
                }))
            );

            return;
        }

        onChange(combinadas);
    };

    const removerImagem = (id: string) => {
        const restantes = imagens.filter(
            (imagem) => imagem.id !== id
        );

        if (
            restantes.length > 0 &&
            !restantes.some((imagem) => imagem.principal)
        ) {
            restantes[0] = {
                ...restantes[0],
                principal: true,
            };
        }

        onChange(restantes);
    };

    const definirPrincipal = (id: string) => {
        onChange(
            imagens.map((imagem) => ({
                ...imagem,
                principal: imagem.id === id,
            }))
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text
                        style={[
                            styles.titulo,
                            { color: colors.text },
                        ]}
                    >
                        Galeria de imagens
                    </Text>

                    <Text
                        style={[
                            styles.subtitulo,
                            { color: colors.text },
                        ]}
                    >
                        {imagens.length} de {maxImagens} imagens
                    </Text>
                </View>

                {editable && imagens.length < maxImagens && (
                    <TouchableOpacity
                        style={[
                            styles.botaoAdicionar,
                            { backgroundColor: colors.primary === '#ffffff' ? '#005CE4' : colors.primary },
                        ]}

                        onPress={selecionarImagens}
                        accessibilityRole="button"
                        accessibilityLabel="Adicionar imagens"
                    >
                        <Ionicons
                            name="add"
                            size={21}
                            color="#FFFFFF"
                        />

                        <Text style={styles.textoBotao}>
                            Adicionar
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {imagens.length === 0 ? (
                <TouchableOpacity
                    style={[
                        styles.areaVazia,
                        {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                        },
                    ]}
                    onPress={selecionarImagens}
                    disabled={!editable}
                >
                    <Ionicons
                        name="images-outline"
                        size={36}
                        color={colors.primary}
                    />

                    <Text
                        style={[
                            styles.textoVazio,
                            { color: colors.text },
                        ]}
                    >
                        Adicione fotos do produto
                    </Text>

                    <Text
                        style={[
                            styles.ajudaVazio,
                            { color: colors.text },
                        ]}
                    >
                        Selecione uma ou mais imagens
                    </Text>
                </TouchableOpacity>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.lista}
                >
                    {imagens.map((imagem) => (
                        <View
                            key={imagem.id}
                            style={styles.item}
                        >
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => editable && definirPrincipal(imagem.id)}
                                onLongPress={() => setImagemExpandida(imagem)}
                                delayLongPress={300}
                                disabled={!editable}
                                accessibilityRole="button"
                                accessibilityLabel={
                                    imagem.principal
                                        ? "Imagem principal"
                                        : "Definir como imagem principal"
                                }
                                accessibilityHint="Mantenha pressionado para expandir"
                            >
                                <Image
                                    source={{ uri: imagem.uri }}
                                    style={[
                                        styles.miniatura,
                                        imagem.principal &&
                                        styles.miniaturaPrincipal,
                                    ]}
                                />

                                {imagem.principal && (
                                    <View style={styles.etiquetaPrincipal}>
                                        <Ionicons
                                            name="star"
                                            size={11}
                                            color="#FFFFFF"
                                        />

                                        <Text
                                            style={styles.textoPrincipal}
                                        >
                                            Principal
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {editable && (
                                <TouchableOpacity
                                    style={styles.botaoRemover}
                                    onPress={() =>
                                        removerImagem(imagem.id)
                                    }
                                    accessibilityRole="button"
                                    accessibilityLabel="Remover imagem"
                                >
                                    <Ionicons
                                        name="close"
                                        size={17}
                                        color="#FFFFFF"
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}

            {imagens.length > 0 && editable && (
                <Text
                    style={[
                        styles.instrucao,
                        { color: colors.text },
                    ]}
                >
                    Toque em uma imagem para defini-la como principal.
                </Text>
            )}
            <Modal
                visible={imagemExpandida !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setImagemExpandida(null)}
                statusBarTranslucent
            >
                <Pressable
                    style={styles.fundoModal}
                    onPress={() => setImagemExpandida(null)}
                >
                    {imagemExpandida && (
                        <Image
                            source={{ uri: imagemExpandida.uri }}
                            style={styles.imagemExpandida}
                            resizeMode="contain"
                        />
                    )}

                    <TouchableOpacity
                        style={styles.botaoFechar}
                        onPress={() => setImagemExpandida(null)}
                        accessibilityRole="button"
                        accessibilityLabel="Fechar visualização"
                    >
                        <Ionicons name="close" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        marginBottom: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    titulo: {
        fontSize: 17,
        fontWeight: "700",
    },
    subtitulo: {
        fontSize: 12,
        opacity: 0.7,
        marginTop: 3,
    },
    botaoAdicionar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 10,
        gap: 4,
    },
    textoBotao: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "600",
    },
    areaVazia: {
        minHeight: 150,
        borderWidth: 1,
        borderStyle: "dashed",
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    textoVazio: {
        fontSize: 14,
        fontWeight: "600",
        marginTop: 10,
    },
    ajudaVazio: {
        fontSize: 12,
        opacity: 0.7,
        marginTop: 5,
    },
    lista: {
        paddingVertical: 4,
        paddingRight: 8,
    },
    item: {
        position: "relative",
        marginRight: 12,
    },
    miniatura: {
        width: 112,
        height: 112,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "transparent",
    },
    miniaturaPrincipal: {
        borderColor: "#1976D2",
    },
    etiquetaPrincipal: {
        position: "absolute",
        bottom: 5,
        left: 5,
        right: 5,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1976D2",
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    textoPrincipal: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "700",
    },
    botaoRemover: {
        position: "absolute",
        top: -7,
        right: -7,
        width: 25,
        height: 25,
        borderRadius: 13,
        backgroundColor: "#D32F2F",
        alignItems: "center",
        justifyContent: "center",
        elevation: 3,
    },
    instrucao: {
        fontSize: 12,
        opacity: 0.7,
        marginTop: 10,
    },
    fundoModal: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        alignItems: "center",
        justifyContent: "center",
    },
    imagemExpandida: {
        width: "100%",
        height: "80%",
    },
    botaoFechar: {
        position: "absolute",
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
});

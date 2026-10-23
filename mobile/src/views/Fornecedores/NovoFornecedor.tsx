import Avatar from "@components/Avatar";
import Nav from "@components/utilities/Nav";
import EditableTextCard from "@components/EditableTextCard";
import Button from "@components/botoes/Button";
import { InputError } from "@components/InputError";
import DialogConfirmarAcao from "@components/dialogs/DialogConfirmarAcao";

import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { useAuth } from "@context/AuthContext";
import { can } from "@utils/permissions";
import { FormAccessProvider } from "@context/FormAccessContext";

import { RootStackParamList } from "@context/types";
import { useTheme } from "@context/ThemeContext";

import { fornecedorSchema } from "@schemas/FornecedorSchema";
import { createCategoria, getCategorias } from "@api/apiCategoria";
import { CategoriaType } from "@context/types";
import ModalSelecaoCategorias from "@components/ModalSelecaoCategorias";
import ClickableTextCard from "@components/ClickableTextCard";

import {
    createFornecedor,
    deleteFornecedor,
    getFornecedor,
    removeFornecedorAvatar,
    updateFornecedor,
    updateFornecedorAvatar,
} from "@api/apiFornecedores";

import { getCep } from "@api/apiCep";

import {
    formatCep,
    formatCnpj,
    formatTelefone,
    onlyLetters,
    onlyLettersAndNumbers,
    onlyNumbers,
} from "@core/utils/format";

import Toast from "react-native-toast-message";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Route = NativeStackScreenProps<
    RootStackParamList,
    "NovoFornecedor"
>["route"];

type FormData = z.input<typeof fornecedorSchema>;

export default function NovoFornecedor() {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<Route>();
    const { colors } = useTheme();
    const { user } = useAuth();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [avatar, setAvatar] = useState<string | null>(null);
    const [avatarOriginal, setAvatarOriginal] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [categorias, setCategorias] = useState<CategoriaType[]>([]);
    const [showCategoriasModal, setShowCategoriasModal] = useState(false);
    const [showNovaCategoriaModal, setShowNovaCategoriaModal] = useState(false);
    const [nomeNovaCategoria, setNomeNovaCategoria] = useState("");
    const [salvandoCategoria, setSalvandoCategoria] = useState(false);

    const modo = route.params?.modo ?? "criar";
    const fornecedorId = route.params?.fornecedorId;

    const isCriar = modo === "criar";
    const isEditar = modo === "editar";
    const podeCriar = can(user, 'fornecedores.criar');
    const podeEditar = can(user, 'fornecedores.editar');
    const podeExcluir = can(user, 'fornecedores.excluir');
    const formCanEdit = isCriar ? podeCriar : podeEditar;
    const avatarAlterado = avatar !== avatarOriginal;
    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: {
            isDirty,
        },
    } = useForm<FormData>({
        resolver: zodResolver(fornecedorSchema),
        mode: "onChange",
        defaultValues: {
            nome: "",
            cnpj: "",
            email: null,
            telefone: null,
            categoria_ids: [],
            nome_responsavel: null,
            chave_pix: null,
            endereco: {
                cep: "",
                logradouro: "",
                numero: "",
                complemento: null,
                bairro: "",
                cidade: "",
                estado: "",
            },
        },
    });
    const unsavedGuard = useUnsavedChangesGuard({
        hasUnsavedChanges: isDirty || avatarAlterado,
        message: isCriar
            ? "O cadastro do fornecedor não foi concluído. Deseja sair e descartar os dados preenchidos?"
            : "A atualização do fornecedor não foi concluída. Deseja sair e descartar as alterações?",
    });

    const nomeFornecedor = watch("nome");
    const categoriaIdsSelecionadas = watch("categoria_ids") ?? [];

    useEffect(() => {
        getCategorias().then((response) => setCategorias(response.data)).catch(() => setCategorias([]));
    }, []);

    const handleCreateCategoria = async () => {
        const nome = nomeNovaCategoria.trim();
        if (!nome) {
            Toast.show({ type: "error", text1: "Nome obrigatório", text2: "Informe o nome da categoria." });
            return;
        }

        try {
            setSalvandoCategoria(true);
            const response = await createCategoria(nome);
            const novaCategoria = response.data;
            const id = String(novaCategoria.id);
            setCategorias((atuais) => [...atuais.filter((categoria) => String(categoria.id) !== id), novaCategoria]);
            setValue("categoria_ids", [...new Set([...categoriaIdsSelecionadas, id])], { shouldDirty: true, shouldValidate: true });
            setNomeNovaCategoria("");
            setShowNovaCategoriaModal(false);
            setShowCategoriasModal(true);
            Toast.show({ type: "success", text1: "Categoria cadastrada", text2: "A categoria foi criada e selecionada." });
        } catch (error: any) {
            Toast.show({ type: "error", text1: "Erro ao cadastrar categoria", text2: error?.response?.data?.message ?? "Não foi possível cadastrar a categoria." });
        } finally {
            setSalvandoCategoria(false);
        }
    };

    const handleDelete = () => {
        if (!fornecedorId) {
            return;
        }

        setShowDeleteDialog(true);
    };

    const confirmarExclusao = async () => {
        if (!fornecedorId) {
            return;
        }

        try {
            setSaving(true);

            await deleteFornecedor(fornecedorId);

            Toast.show({
                type: "success",
                text1: "Fornecedor excluído",
                text2: "O fornecedor foi removido com sucesso.",
            });

            unsavedGuard.permitirProximaSaida();
            navigation.goBack();
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao excluir fornecedor",
                text2:
                    error?.response?.data?.message ??
                    "Não foi possível excluir o fornecedor.",
            });
        } finally {
            setSaving(false);
        }
    };

    const carregarFornecedor = useCallback(async () => {
        if (isCriar) {
            return;
        }

        if (!fornecedorId) {
            Toast.show({
                type: "error",
                text1: "Fornecedor não informado",
            });

            navigation.goBack();
            return;
        }

        try {
            setLoading(true);

            const response = await getFornecedor(fornecedorId);
            const fornecedor = response.data;

            const dados: FormData = {
                nome: fornecedor.nome ?? "",
                cnpj: fornecedor.cnpj ?? "",
                email: fornecedor.email ?? null,
                telefone: fornecedor.telefone ?? null,
                categoria_ids: fornecedor.categorias?.map((categoria: CategoriaType) => String(categoria.id)) ?? [],
                nome_responsavel: fornecedor.nome_responsavel ?? null,
                chave_pix: fornecedor.chave_pix ?? null,

                endereco: {
                    cep: fornecedor.endereco?.cep ?? "",
                    logradouro: fornecedor.endereco?.logradouro ?? "",
                    numero: fornecedor.endereco?.numero ?? "",
                    complemento: fornecedor.endereco?.complemento ?? null,
                    bairro: fornecedor.endereco?.bairro ?? "",
                    cidade: fornecedor.endereco?.cidade ?? "",
                    estado: fornecedor.endereco?.estado ?? "",
                },
            };

            reset(dados);

            const avatarUrl = fornecedor.avatar_url ?? null;

            setAvatar(avatarUrl);
            setAvatarOriginal(avatarUrl);
        } catch (error: any) {


            Toast.show({
                type: "error",
                text1: "Erro ao carregar fornecedor",
                text2:
                    error?.response?.data?.message ??
                    "Não foi possível carregar os dados.",
            });
        } finally {
            setLoading(false);
        }
    }, [fornecedorId, isCriar, navigation, reset]);

    useEffect(() => {
        carregarFornecedor();
    }, [carregarFornecedor]);

    const buscarCep = async (cep: string) => {
        const cepLimpo = cep.replace(/\D/g, "");

        if (cepLimpo.length !== 8) {
            return;
        }

        try {
            const endereco = await getCep(cepLimpo);

            setValue(
                "endereco.logradouro",
                endereco.logradouro ?? "",
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            );

            setValue(
                "endereco.bairro",
                endereco.bairro ?? "",
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            );

            setValue(
                "endereco.cidade",
                endereco.localidade ?? "",
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            );

            setValue(
                "endereco.estado",
                endereco.uf ?? "",
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            );
        } catch {
            Toast.show({
                type: "error",
                text1: "CEP não encontrado",
                text2: "Verifique o CEP informado.",
            });
        }
    };

    const handleImageSelected = (uri: string) => {
        setAvatar(uri);
    };

    const handleRemoveAvatar = () => {
        setAvatar(null);
    };

    const onSubmit = async (data: FormData) => {
        if (!isDirty && !avatarAlterado) {
            return;
        }

        try {
            setSaving(true);

            const payload = {
                nome: data.nome,
                cnpj: data.cnpj,
                email: data.email || null,
                telefone: data.telefone || null,
                categoria_ids: data.categoria_ids,
                nome_responsavel: data.nome_responsavel || null,
                chave_pix: data.chave_pix || null,
                endereco: data.endereco,
            };

            if (isCriar) {
                const response = await createFornecedor(payload);

                const novoFornecedor = response.data;

                if (avatar) {
                    await updateFornecedorAvatar(
                        novoFornecedor.id,
                        avatar,
                    );
                }

                Toast.show({
                    type: "success",
                    text1: "Fornecedor cadastrado",
                    text2: "O fornecedor foi cadastrado com sucesso.",
                });

                unsavedGuard.permitirProximaSaida();
                navigation.goBack();
                return;
            }

            if (isEditar && fornecedorId) {
                let dadosAtualizados = false;

                if (isDirty) {
                    await updateFornecedor(fornecedorId, payload);
                    dadosAtualizados = true;
                }

                if (avatarAlterado) {
                    if (avatar) {
                        await updateFornecedorAvatar(fornecedorId, avatar);
                    } else if (avatarOriginal) {
                        await removeFornecedorAvatar(fornecedorId);
                    }

                    dadosAtualizados = true;
                }

                if (dadosAtualizados) {
                    Toast.show({
                        type: "success",
                        text1: "Fornecedor atualizado",
                        text2: "As alterações foram salvas com sucesso.",
                    });
                }

                reset(data);
                setAvatarOriginal(avatar);
            }
        } catch (error: any) {


            Toast.show({
                type: "error",
                text1: "Erro ao salvar fornecedor",
                text2:
                    error?.response?.data?.message ??
                    "Não foi possível salvar as alterações.",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: colors.background,
                        justifyContent: "center",
                        alignItems: "center",
                    },
                ]}
            >
                <ActivityIndicator size="large" />

                <Text
                    style={{
                        color: colors.text,
                        marginTop: 12,
                    }}
                >
                    Carregando fornecedor...
                </Text>
            </View>
        );
    }

    return (
        <FormAccessProvider canEdit={formCanEdit}>
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.background,
                },
            ]}
        >
            <Nav
                title={isCriar ? "Novo Fornecedor" : "Editar Fornecedor"}
                subtitle="Dados do fornecedor"
                onBackPress={() => navigation.goBack()}
                rightType="menu"
            />

            <KeyboardAwareScrollView
                style={styles.flex}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid
                enableAutomaticScroll
                extraScrollHeight={50}
            >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <Avatar
                        nome={nomeFornecedor || "Fornecedor"}
                        imageUri={avatar}
                        size={120}
                        editable
                        onImageSelected={handleImageSelected}
                        onImageRemoved={handleRemoveAvatar}
                    />

                    <Text
                        style={[
                            styles.avatarLabel,
                            {
                                color: colors.text,
                            },
                        ]}
                    >
                        Foto do fornecedor
                    </Text>
                </View>

                {/* Dados principais */}
                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                color: colors.text,
                            },
                        ]}
                    >
                        Dados principais
                    </Text>

                    <Controller
                        control={control}
                        name="nome"
                        render={({
                            field: {
                                value,
                                onChange,
                            },
                            fieldState: {
                                error,
                            },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="Nome do fornecedor"
                                    placeholder="Digite o nome do fornecedor"
                                    value={value}
                                    editable
                                    onChangeText={(text) => {
                                        onChange(
                                            onlyLettersAndNumbers(text, 255),
                                        );
                                    }}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="cnpj"
                        render={({
                            field: {
                                value,
                                onChange,
                            },
                            fieldState: {
                                error,
                            },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="CNPJ"
                                    placeholder="00.000.000/0000-00"
                                    value={formatCnpj(value ?? "")}
                                    editable
                                    tipo="number"
                                    onChangeText={(text) => {
                                        onChange(onlyNumbers(text, 14));
                                    }}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller control={control} name="categoria_ids" render={({ fieldState: { error } }) => (
                        <View style={{ gap: 8 }}>
                            <ClickableTextCard
                                label="Ramos de atividade"
                                placeholder="Selecione uma ou mais categorias"
                                value={categorias.filter((categoria) => categoriaIdsSelecionadas.includes(String(categoria.id))).map((categoria) => categoria.nome).join(", ")}
                                onPress={() => setShowCategoriasModal(true)}
                            />
                            <InputError message={error?.message} />
                        </View>
                    )} />

                    <Controller
                        control={control}
                        name="email"
                        render={({
                            field: {
                                value,
                                onChange,
                            },
                            fieldState: {
                                error,
                            },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="E-mail"
                                    placeholder="Digite o e-mail"
                                    value={value ?? ""}
                                    editable
                                    onChangeText={onChange}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="telefone"
                        render={({
                            field: {
                                value,
                                onChange,
                            },
                            fieldState: {
                                error,
                            },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="Telefone"
                                    placeholder="(00) 00000-0000"
                                    value={formatTelefone(value ?? "")}
                                    editable
                                    tipo="number"
                                    onChangeText={(text) => {
                                        onChange(onlyNumbers(text, 11));
                                    }}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />
                </View>

                {/* Responsável e pagamento */}
                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                color: colors.text,
                            },
                        ]}
                    >
                        Responsável e pagamento
                    </Text>

                    <Controller
                        control={control}
                        name="nome_responsavel"
                        render={({
                            field: {
                                value,
                                onChange,
                            },
                            fieldState: {
                                error,
                            },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="Nome do responsável"
                                    placeholder="Digite o nome do responsável"
                                    value={value ?? ""}
                                    editable
                                    onChangeText={(text) => {
                                        onChange(onlyLetters(text, 255));
                                    }}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="chave_pix"
                        render={({
                            field: {
                                value,
                                onChange,
                            },
                            fieldState: {
                                error,
                            },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="Chave PIX"
                                    placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                                    value={value ?? ""}
                                    editable
                                    onChangeText={onChange}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />
                </View>

                {/* Endereço */}
                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                color: colors.text,
                            },
                        ]}
                    >
                        Endereço
                    </Text>

                    <Controller
                        control={control}
                        name="endereco.cep"
                        render={({
                            field: {
                                value,
                                onChange,
                            },
                            fieldState: {
                                error,
                            },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="CEP"
                                    placeholder="00000-000"
                                    value={formatCep(value ?? "")}
                                    editable
                                    tipo="number"
                                    onChangeText={(text) => {
                                        const cep = onlyNumbers(text, 8);

                                        onChange(cep);

                                        if (cep.length === 8) {
                                            buscarCep(cep);
                                        }
                                    }}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="endereco.logradouro"
                        render={({
                            field: {
                                value,
                                onChange,
                            },
                        }) => (
                            <EditableTextCard
                                label="Logradouro"
                                placeholder="Rua, avenida..."
                                value={value}
                                editable
                                onChangeText={onChange}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="endereco.complemento"
                        render={({
                            field: {
                                value,
                                onChange,
                            },
                        }) => (
                            <EditableTextCard
                                label="Complemento"
                                placeholder="Apartamento, sala..."
                                value={value ?? ""}
                                editable
                                onChangeText={onChange}
                            />
                        )}
                    />

                    <View style={styles.row}>
                        <Controller
                            control={control}
                            name="endereco.numero"
                            render={({
                                field: {
                                    value,
                                    onChange,
                                },
                            }) => (
                                <EditableTextCard
                                    label="Número"
                                    placeholder="Número"
                                    value={value}
                                    width="48%"
                                    editable
                                    onChangeText={(text) => {
                                        onChange(
                                            text
                                                .replace(/[^\p{L}\d\s/-]/gu, "")
                                                .slice(0, 20),
                                        );
                                    }}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="endereco.bairro"
                            render={({
                                field: {
                                    value,
                                    onChange,
                                },
                            }) => (
                                <EditableTextCard
                                    label="Bairro"
                                    placeholder="Bairro"
                                    value={value}
                                    width="48%"
                                    editable
                                    onChangeText={onChange}
                                />
                            )}
                        />
                    </View>

                    <Controller
                        control={control}
                        name="endereco.cidade"
                        render={({
                            field: {
                                value,
                                onChange,
                            },
                        }) => (
                            <EditableTextCard
                                label="Cidade"
                                placeholder="Digite a cidade"
                                value={value}
                                editable
                                onChangeText={onChange}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="endereco.estado"
                        render={({
                            field: {
                                value,
                                onChange,
                            },
                            fieldState: {
                                error,
                            },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="Estado"
                                    placeholder="UF"
                                    value={value}
                                    editable
                                    onChangeText={(text) => {
                                        onChange(
                                            text
                                                .replace(/[^a-zA-Z]/g, "")
                                                .slice(0, 2)
                                                .toUpperCase(),
                                        );
                                    }}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />
                </View>

                {/* Ações */}
                <View style={styles.actionsContainer}>
                    {formCanEdit && <Button
                        title={
                            saving
                                ? "Salvando..."
                                : isCriar
                                    ? "Cadastrar fornecedor"
                                    : "Salvar alterações"
                        }
                        variant="contained"
                        color="primary"
                        disabled={
                            (!isDirty && !avatarAlterado) || saving
                        }
                        onPress={handleSubmit(onSubmit)}
                    />}

                    {isEditar && podeExcluir && (
                        <Button
                            title="Excluir fornecedor"
                            variant="delete"
                            disabled={saving}
                            onPress={handleDelete}
                        />
                    )}
                </View>
            </KeyboardAwareScrollView>

            <DialogConfirmarAcao
                show={showDeleteDialog}
                setShow={setShowDeleteDialog}
                titulo="Tem certeza que deseja excluir este fornecedor?"
                onSuccess={confirmarExclusao}
            />
            <ModalSelecaoCategorias
                visible={showCategoriasModal}
                categorias={categorias}
                selecionadas={categoriaIdsSelecionadas}
                onChange={(ids) => setValue("categoria_ids", ids, { shouldDirty: true, shouldValidate: true })}
                onAdd={() => {
                    setShowCategoriasModal(false);
                    setShowNovaCategoriaModal(true);
                }}
                onClose={() => setShowCategoriasModal(false)}
            />
            <Modal
                visible={showNovaCategoriaModal}
                transparent
                animationType="fade"
                onRequestClose={() => { if (!salvandoCategoria) setShowNovaCategoriaModal(false); }}
            >
                <Pressable style={styles.categoryDialogOverlay} onPress={() => { if (!salvandoCategoria) setShowNovaCategoriaModal(false); }}>
                    <Pressable style={[styles.categoryDialog, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
                        <Text style={[styles.categoryDialogTitle, { color: colors.accentText }]}>Nova categoria</Text>
                        <Text style={[styles.categoryDialogDescription, { color: colors.muted }]}>Informe o nome da categoria que deseja cadastrar.</Text>
                        <TextInput
                            style={[styles.categoryDialogInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                            placeholder="Ex.: Bebidas"
                            placeholderTextColor={colors.muted}
                            value={nomeNovaCategoria}
                            onChangeText={(texto) => setNomeNovaCategoria(texto.slice(0, 255))}
                            maxLength={255}
                            autoCapitalize="sentences"
                            editable={!salvandoCategoria}
                            returnKeyType="done"
                            onSubmitEditing={handleCreateCategoria}
                        />
                        <View style={styles.categoryDialogActions}>
                            <TouchableOpacity style={[styles.categoryDialogButton, { backgroundColor: colors.elevated }]} disabled={salvandoCategoria} onPress={() => { setShowNovaCategoriaModal(false); setNomeNovaCategoria(""); }}>
                                <Text style={[styles.categoryDialogCancelText, { color: colors.text }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.categoryDialogButton, { backgroundColor: colors.accentText }, salvandoCategoria && styles.categoryDialogDisabled]} disabled={salvandoCategoria} onPress={handleCreateCategoria}>
                                <Text style={styles.categoryDialogSaveText}>{salvandoCategoria ? "Salvando..." : "Cadastrar"}</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
            {unsavedGuard.dialog}
        </View>
        </FormAccessProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    flex: {
        flex: 1,
    },

    content: {
        padding: 20,
        paddingBottom: 30,
    },

    avatarContainer: {
        alignItems: "center",
        marginTop: 20,
        marginBottom: 25,
    },

    avatarLabel: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: "600",
    },

    section: {
        marginBottom: 15,
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: "800",
        marginBottom: 5,
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    actionsContainer: {
        alignItems: "center",
        width: "100%",
        gap: 12,
        marginBottom: 5,
    },
    categoryDialogOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    categoryDialog: {
        width: "100%",
        maxWidth: 400,
        borderRadius: 20,
        padding: 22,
    },
    categoryDialogTitle: {
        fontSize: 21,
        fontWeight: "700",
        marginBottom: 8,
    },
    categoryDialogDescription: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    categoryDialogInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    categoryDialogActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
    },
    categoryDialogButton: {
        minWidth: 105,
        minHeight: 44,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    categoryDialogCancelText: {
        fontSize: 14,
        fontWeight: "600",
    },
    categoryDialogSaveText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },
    categoryDialogDisabled: {
        opacity: 0.6,
    },
});

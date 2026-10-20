import Avatar from "@components/Avatar";
import Nav from "@components/utilities/Nav";
import EditableTextCard from "@components/EditableTextCard";
import Selector from "@components/Selector";
import DateField from "@components/DateField";
import Button from "@components/botoes/Button";
import { InputError } from "@components/InputError";
import DialogConfirmarAcao from "@components/dialogs/DialogConfirmarAcao";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { RoleName, RootStackParamList, Opcao } from "@context/types";
import { useTheme } from "@context/ThemeContext";

import {
    ActivityIndicator,

    StyleSheet,
    Text,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { funcionarioSchema } from "@schemas/FuncionarioSchema";
import {
    formatCpf,
    formatTelefone,
    onlyNumbers,
    dateFromApi,
    dateToApi,
} from "@core/utils/format";
import { createFuncionario, deleteFuncionario, getFuncionario, removeFuncionarioAvatar, updateFuncionario, updateFuncionarioAvatar } from "@api/apiFuncionario";
import ClickableTextCard from "@components/ClickableTextCard";
import ModalPermissoes from "@components/ModalPermissoes";
import { useAuth } from "@context/AuthContext";
import { getPapeis } from "@api/apiAcessos";
import { formatErrorMessage } from "@core/utils/format";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Route = NativeStackScreenProps<RootStackParamList, "NovoFuncionario">["route"];

type FormData = z.input<typeof funcionarioSchema>;
type FormInput = z.input<typeof funcionarioSchema>;
type FormOutput = z.output<typeof funcionarioSchema>;
type RoleForm = FormData["role"];

const PERFIS_FALLBACK: Opcao[] = [
    { id: "admin", nome: "Administrador" },
    { id: "gestor", nome: "Gestor" },
    { id: "funcionario", nome: "Funcionário" },
];

const PAPEIS_FUNCIONARIO: readonly RoleName[] = ["admin", "gestor", "funcionario"];

export default function NovoFuncionario() {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<Route>();
    const { colors } = useTheme();
    const modo = route.params?.modo ?? "criar";
    const funcionarioId = route.params?.funcionarioId;
    const isCriar = modo === "criar";
    const isEditar = modo === "editar";
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [avatar, setAvatar] = useState<string | null>(null);
    const [avatarOriginal, setAvatarOriginal] = useState<string | null>(null);
    const { user: usuarioLogado } = useAuth();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [perfis, setPerfis] = useState<Opcao[]>(PERFIS_FALLBACK);
    const [loadingPerfis, setLoadingPerfis] = useState(false);
    const perfisCarregados = useRef(false);
    const carregandoPerfis = useRef(false);
    const avatarAlterado = avatar !== avatarOriginal;

    const usuarioLogadoId = (usuarioLogado as { id?: string | number } | null)?.id;

    const isProprioUsuario =
        isEditar &&
        usuarioLogadoId != null &&
        String(usuarioLogadoId) === funcionarioId;

    const { control, handleSubmit, reset, setError, watch, formState: { isDirty } } =
        useForm<FormInput, unknown, FormOutput>({
            resolver: zodResolver(funcionarioSchema),
            mode: "onChange",
            defaultValues: {
                name: "",
                email: "",
                password: "",
                password_confirmation: "",
                telefone: "",
                cpf: "",
                data_nascimento: "",
                role: "funcionario",
                permissions: [],
            },
        });



    const normalizarPapel = (role: string | null): RoleForm => {
        const papel = role?.toLowerCase().trim();

        return (PAPEIS_FUNCIONARIO.find((p) => p === papel) ?? "funcionario") as RoleForm;
    };

    const carregarPerfis = async () => {
        if (perfisCarregados.current || carregandoPerfis.current) {
            return;
        }

        try {
            carregandoPerfis.current = true;
            setLoadingPerfis(true);

            const response = await getPapeis();

            const lista: Opcao[] = response.data
                .filter((papel) => papel.name !== "cliente")
                .map((papel) => ({
                    id: papel.name,
                    nome: papel.label,
                }));

            if (lista.length > 0) {
                setPerfis(lista);
            }

            perfisCarregados.current = true;
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao carregar perfis",
                text2:
                    error?.response?.data?.message ??
                    "Usando a lista padrão.",
            });
        } finally {
            carregandoPerfis.current = false;
            setLoadingPerfis(false);
        }
    };

    useEffect(() => {
        if (isCriar) return;

        if (!funcionarioId) {
            Toast.show({ type: "error", text1: "Funcionário não informado" });
            navigation.goBack();
            return;
        }

        let cancelado = false;

        const carregarFuncionario = async () => {
            try {
                setLoading(true);

                const { data: funcionario } = await getFuncionario(funcionarioId);
                if (cancelado) return;

                reset({
                    name: funcionario.nome ?? "",
                    email: funcionario.email ?? "",
                    password: "",
                    password_confirmation: "",
                    telefone: onlyNumbers(funcionario.telefone ?? "", 11),
                    cpf: onlyNumbers(funcionario.cpf ?? "", 11),
                    data_nascimento: dateFromApi(funcionario.data_nascimento?.slice(0, 10)) ?? "",
                    role: normalizarPapel(funcionario.role),
                    permissions: [], 
                });

                const avatarUrl = funcionario.avatar_url ?? null;
                setAvatar(avatarUrl);
                setAvatarOriginal(avatarUrl);
            } catch (error) {
                if (cancelado) return;

                Toast.show({
                    type: "error",
                    text1: "Erro ao carregar funcionário",
                    text2: formatErrorMessage(error, "Não foi possível carregar os dados."),
                });
            } finally {
                if (!cancelado) setLoading(false);
            }
        };

        carregarFuncionario();

        return () => {
            cancelado = true;
        };
    }, [funcionarioId, isCriar, navigation, reset]);

    const handleDelete = () => {
        if (!funcionarioId) {
            return;
        }

        setShowDeleteDialog(true);
    };

    const confirmarExclusao = async () => {
        if (!funcionarioId) {
            return;
        }

        try {
            setSaving(true);

            await deleteFuncionario(funcionarioId);

            Toast.show({
                type: "success",
                text1: "Funcionário excluído",
                text2: "O funcionário foi removido com sucesso.",
            });

            navigation.goBack();
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao excluir funcionário",
                text2:
                    error?.response?.data?.message ??
                    "Não foi possível excluir o funcionário.",
            });
        } finally {
            setSaving(false);
            setShowDeleteDialog(false);
        }
    };

    const onSubmit = async (data: FormOutput) => {
        if (isCriar && !data.password) {
            setError("password", {
                type: "manual",
                message: "A senha é obrigatória no cadastro.",
            });
            return;
        }

        if (isEditar && !isDirty && !avatarAlterado) return;

        const telefone = typeof data.telefone === "string" ? data.telefone : "";
        const cpf = typeof data.cpf === "string" ? data.cpf : "";

        const base = {
            name: data.name.trim(),
            email: data.email.trim(),
            telefone: telefone || null,
            cpf,
            data_nascimento: dateToApi(data.data_nascimento),
            role: data.role,
            permissions: data.permissions ?? [],
        };

        const senha = {
            password: data.password ?? "",
            password_confirmation: data.password_confirmation ?? "",
        };

        try {
            setSaving(true);

            if (isCriar) {
                const response = await createFuncionario({ ...base, ...senha });
                const novoId = response.data.id;

                let avatarFalhou = false;

                if (avatar && novoId) {
                    try {
                        await updateFuncionarioAvatar(novoId, avatar);
                    } catch {
                        avatarFalhou = true;
                    }
                }

                Toast.show({
                    type: avatarFalhou ? "info" : "success",
                    text1: "Funcionário cadastrado",
                    text2: avatarFalhou
                        ? "Mas não foi possível enviar a foto. Tente novamente pela edição."
                        : "O funcionário foi cadastrado com sucesso.",
                });

                navigation.goBack();
                return;
            }

            if (isEditar && funcionarioId) {
                let houveAlteracao = false;

                if (isDirty) {
                    await updateFuncionario(
                        funcionarioId,
                        data.password ? { ...base, ...senha } : base
                    );
                    houveAlteracao = true;
                }

                if (avatarAlterado) {
                    if (avatar) {
                        await updateFuncionarioAvatar(funcionarioId, avatar);
                    } else if (avatarOriginal) {
                        await removeFuncionarioAvatar(funcionarioId);
                    }
                    houveAlteracao = true;
                }

                if (houveAlteracao) {
                    Toast.show({
                        type: "success",
                        text1: "Funcionário atualizado",
                        text2: "As alterações foram salvas com sucesso.",
                    });
                }

                reset({ ...data, password: "", password_confirmation: "" });
                setAvatarOriginal(avatar);
            }
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Erro ao salvar funcionário",
                text2: formatErrorMessage(error, "Não foi possível salvar os dados."),
            });
        } finally {
            setSaving(false);
        }
    };

    const handleImageSelected = (uri: string) => {
        setAvatar(uri);
    };

    const handleRemoveAvatar = () => {
        setAvatar(null);
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
                    Carregando funcionário...
                </Text>
            </View>
        );
    }

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.background },
            ]}
        >
            <Nav
                title={isCriar ? "Novo Funcionário" : "Editar Funcionário"}
                subtitle="Dados e acessos"
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
                <View style={styles.avatarContainer}>
                    <Avatar
                        nome={watch("name") || "Funcionário"}
                        imageUri={avatar}
                        size={120}
                        editable
                        onImageSelected={handleImageSelected}
                        onImageRemoved={handleRemoveAvatar}
                    />

                    <Text
                        style={[
                            styles.avatarLabel,
                            { color: colors.text },
                        ]}
                    >
                        Foto do funcionário
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.text },
                        ]}
                    >
                        Dados da conta
                    </Text>

                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <>
                                <EditableTextCard
                                    label="Nome completo"
                                    placeholder="Digite o nome completo"
                                    value={value}
                                    onChangeText={onChange}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <>
                                <EditableTextCard
                                    label="E-mail"
                                    placeholder="Digite o e-mail"
                                    value={value}
                                    onChangeText={onChange}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <>
                                <EditableTextCard
                                    label={isCriar ? "Senha" : "Nova senha"}
                                    placeholder={
                                        isCriar
                                            ? "Digite uma senha"
                                            : "Deixe vazio para manter a senha atual"
                                    }
                                    value={value ?? ""}
                                    onChangeText={onChange}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="password_confirmation"
                        render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <>
                                <EditableTextCard
                                    label="Confirmar senha"
                                    placeholder="Repita a senha"
                                    value={value ?? ""}
                                    onChangeText={onChange}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />
                </View>

                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.text },
                        ]}
                    >
                        Dados pessoais
                    </Text>

                    <Controller
                        control={control}
                        name="cpf"
                        render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <>
                                <EditableTextCard
                                    label="CPF"
                                    placeholder="000.000.000-00"
                                    value={formatCpf(value ?? "")}
                                    tipo="number"
                                    onChangeText={(text) =>
                                        onChange(onlyNumbers(text, 11))
                                    }
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="telefone"
                        render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <>
                                <EditableTextCard
                                    label="Telefone"
                                    placeholder="(00) 00000-0000"
                                    value={formatTelefone(value ?? "")}
                                    tipo="number"
                                    onChangeText={(text) =>
                                        onChange(onlyNumbers(text, 11))
                                    }
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="data_nascimento"
                        render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <>
                                <DateField
                                    label="Data de nascimento"
                                    value={value ?? ""}
                                    onChange={onChange}
                                    maximumDate={
                                        new Date(Date.now() - 86400000)
                                    }
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />
                </View>

                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.text },
                        ]}
                    >
                        Perfil de acesso
                    </Text>

                    <Controller
                        control={control}
                        name="role"
                        render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <>
                                <Selector
                                    label="Perfil"
                                    placeholder="Selecione um perfil"
                                    value={value}
                                    options={perfis}
                                    onChange={onChange}
                                    onOpen={carregarPerfis}
                                    loading={loadingPerfis}
                                    disabled={isEditar && isProprioUsuario}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Text
                        style={[
                            styles.helperText,
                            { color: colors.text },
                        ]}
                    >
                        O perfil define o conjunto básico de permissões do
                        funcionário. Você também pode atribuir permissões
                        individuais abaixo.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.text },
                        ]}
                    >
                        Permissões individuais
                    </Text>

                    <Controller
                        control={control}
                        name="permissions"
                        render={({ field: { value } }) => {
                            const permissoesSelecionadas = value ?? [];

                            const resumoPermissoes =
                                permissoesSelecionadas.length > 0
                                    ? `${permissoesSelecionadas.length} permissão(ões) selecionada(s)`
                                    : "";

                            return (
                                <>
                                    <ClickableTextCard
                                        label="Permissões"
                                        placeholder="Selecione as permissões"
                                        value={resumoPermissoes}
                                        onPress={() => setShowPermissionsModal(true)}
                                    />

                                    <Text
                                        style={[
                                            styles.helperText,
                                            { color: colors.text },
                                        ]}
                                    >
                                        Selecione uma ou mais permissões para conceder
                                        acessos adicionais ao funcionário.
                                    </Text>
                                </>
                            );
                        }}
                    />

                    <View style={styles.actionsContainer}>
                        <Button
                            title={
                                saving
                                    ? "Salvando..."
                                    : isCriar
                                        ? "Cadastrar funcionário"
                                        : "Salvar alterações"
                            }
                            variant="contained"
                            color="primary"
                            disabled={
                                saving ||
                                (isEditar && !isDirty && !avatarAlterado)
                            }
                            onPress={handleSubmit(onSubmit)}
                        />

                        {isEditar && (
                            <Button
                                title="Excluir funcionário"
                                variant="delete"
                                disabled={saving}
                                onPress={handleDelete}
                            />
                        )}
                    </View>
                </View>
            </KeyboardAwareScrollView>
            <Controller
                control={control}
                name="permissions"
                render={({ field: { value, onChange } }) => (
                    <ModalPermissoes
                        visible={showPermissionsModal}
                        selecionadas={value ?? []}
                        onChange={onChange}
                        onClose={() => setShowPermissionsModal(false)}
                    />
                )}
            />
            <DialogConfirmarAcao
                show={showDeleteDialog}
                setShow={setShowDeleteDialog}
                titulo="Tem certeza que deseja excluir este funcionário?"
                onSuccess={confirmarExclusao}
            />
        </View>
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
        paddingBottom: 35,
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
        marginBottom: 22,
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: "800",
        marginBottom: 12,
    },

    helperText: {
        fontSize: 13,
        lineHeight: 19,
        marginTop: 10,
        opacity: 0.8,
    },

    actionsContainer: {
        alignItems: "center",
        width: "100%",
        gap: 12,
        marginTop: 5,
        marginBottom: 10,
    },
});
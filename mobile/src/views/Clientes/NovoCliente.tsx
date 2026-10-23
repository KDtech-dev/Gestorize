import Avatar from "@components/Avatar";
import Nav from "@components/utilities/Nav";
import EditableTextCard from "@components/EditableTextCard";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { z } from "zod";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { RootStackParamList } from "@context/types";
import { useTheme } from "@context/ThemeContext";
import { clienteSchema } from "@schemas/ClienteSchema";
import { createCliente, deleteCliente, getCliente, removeClienteAvatar, updateCliente, updateClienteAvatar } from "@api/apiClientes";
import Toast from "react-native-toast-message";
import DialogConfirmarAcao from "@components/dialogs/DialogConfirmarAcao";
import { dateFromApi, formatCep, formatCnpj, formatCpf, formatDate, formatRg, formatTelefone, normalizeGenero, onlyLetters, onlyLettersAndNumbers, onlyNumbers } from "@core/utils/format";
import Button from "@components/botoes/Button";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { InputError } from "@components/InputError";
import GeneroSelector from "@components/GeneroSelector";
import { getCep } from "@api/apiCep";
import DateField from "@components/DateField";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import OrcamentoClienteResumo from "@components/orcamentos/OrcamentoClienteResumo";
import { OrcamentoResumoType } from "@context/types";
import { useAuth } from "@context/AuthContext";
import { can } from "@utils/permissions";
import { FormAccessProvider } from "@context/FormAccessContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type FormData = z.input<typeof clienteSchema>;

type Route = NativeStackScreenProps<
    RootStackParamList,
    "NovoCliente"
>["route"];

const nomesDosCampos: Record<string, string> = {
    nome: "Nome",
    email: "E-mail",
    "pf.rg": "RG",
    "pf.cpf": "CPF",
    "pf.data_nascimento": "Data de nascimento",
    "pj.cnpj": "CNPJ",
    "pj.razao_social": "Razão social",
    "pj.nome_responsavel": "Nome do responsável",
    "pj.cpf_responsavel": "CPF do responsável",
};

const coletarErrosFormulario = (valor: unknown, caminho = ""): string[] => {
    if (!valor || typeof valor !== "object") return [];

    const erro = valor as Record<string, unknown>;
    if (typeof erro.message === "string") {
        const campo = nomesDosCampos[caminho] ?? caminho;
        return [`${campo}: ${erro.message}`];
    }

    return Object.entries(erro)
        .filter(([chave]) => !["ref", "type", "types"].includes(chave))
        .flatMap(([chave, filho]) => coletarErrosFormulario(filho, caminho ? `${caminho}.${chave}` : chave));
};

export default function NovoCliente() {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<Route>();
    const { colors } = useTheme();
    const { user } = useAuth();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [avatar, setAvatar] = useState<string | null>(null);
    const [avatarOriginal, setAvatarOriginal] = useState<string | null>(null);
    const [orcamentos, setOrcamentos] = useState<OrcamentoResumoType[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const modo = route.params?.modo ?? "criar";
    const clienteId = route.params?.clienteId;
    const isCriar = modo === "criar";
    const isEditar = modo === "editar";
    const podeCriar = can(user, 'clientes.criar');
    const podeEditar = can(user, 'clientes.editar');
    const podeExcluir = can(user, 'clientes.excluir');
    const formCanEdit = isCriar ? podeCriar : podeEditar;
    const avatarAlterado = avatar !== avatarOriginal;
    const {
        control,
        watch,
        handleSubmit,
        reset,
        setValue,
        formState: {
            isDirty,
        },
    } = useForm<FormData>({
        resolver: zodResolver(clienteSchema),
        mode: "onChange",
        defaultValues: {
            tipo: "pf",

            nome: "",
            email: null,
            telefone: null,

            endereco: {
                cep: "",
                logradouro: "",
                numero: "",
                complemento: null,
                bairro: "",
                cidade: "",
                estado: "",
            },

            pf: {
                genero: null,
                rg: "",
                cpf: "",
                data_nascimento: "",
            },
        },
    });
    const unsavedGuard = useUnsavedChangesGuard({
        hasUnsavedChanges: isDirty || avatarAlterado,
        message: isCriar
            ? "O cadastro do cliente não foi concluído. Deseja sair e descartar os dados preenchidos?"
            : "A atualização do cliente não foi concluída. Deseja sair e descartar as alterações?",
    });


    const handleDelete = () => {
        if (!clienteId) return;

        setShowDeleteDialog(true);
    };

    const confirmarExclusao = async () => {
        if (!clienteId) return;
        try {
            setSaving(true);
            await deleteCliente(clienteId);
            Toast.show({
                type: "success",
                text1: "Cliente excluído",
                text2: "O cliente foi removido com sucesso.",
            });

            unsavedGuard.permitirProximaSaida();
            navigation.goBack();
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Erro ao excluir",
                text2: "Não foi possível excluir o cliente.",
            });
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (modo === "criar") {
            return;
        }

        if (!clienteId) {
            Toast.show({
                type: "error",
                text1: "Cliente não informado",
            }); navigation.goBack();
            return;
        }

        const carregarCliente = async () => {
            try {
                setLoading(true);

                const response = await getCliente(clienteId);
                const cliente = response.data;
                setOrcamentos(cliente.orcamentos ?? []);

                const dados: FormData =
                    cliente.tipo === "pf"
                        ? {
                            tipo: "pf",
                            nome: cliente.nome,
                            email: cliente.email,
                            telefone: cliente.telefone,

                            endereco: {
                                cep: cliente.endereco?.cep ?? "",
                                logradouro: cliente.endereco?.logradouro ?? "",
                                numero: cliente.endereco?.numero ?? "",
                                complemento: cliente.endereco?.complemento ?? null,
                                bairro: cliente.endereco?.bairro ?? "",
                                cidade: cliente.endereco?.cidade ?? "",
                                estado: cliente.endereco?.estado ?? "",
                            },

                            pf: {
                                genero: normalizeGenero(cliente.pf?.genero),
                                rg: cliente.pf?.rg ?? "",
                                cpf: cliente.pf?.cpf ?? "",
                                data_nascimento: dateFromApi(
                                    cliente.pf?.data_nascimento ?? ""
                                ),
                            },
                        }
                        : {
                            tipo: "pj",
                            nome: cliente.nome,
                            email: cliente.email,
                            telefone: cliente.telefone,

                            endereco: {
                                cep: cliente.endereco?.cep ?? "",
                                logradouro: cliente.endereco?.logradouro ?? "",
                                numero: cliente.endereco?.numero ?? "",
                                complemento: cliente.endereco?.complemento ?? null,
                                bairro: cliente.endereco?.bairro ?? "",
                                cidade: cliente.endereco?.cidade ?? "",
                                estado: cliente.endereco?.estado ?? "",
                            },

                            pj: {
                                cnpj: cliente.pj?.cnpj ?? "",
                                razao_social: cliente.pj?.razao_social ?? "",
                                nome_fantasia: cliente.pj?.nome_fantasia ?? null,
                                nome_responsavel: cliente.pj?.nome_responsavel ?? "",
                                cpf_responsavel: cliente.pj?.cpf_responsavel ?? "",
                                cargo_responsavel: cliente.pj?.cargo_responsavel ?? null,
                            },
                        };

                reset(dados);

                const avatarUrl = cliente.avatar_url ?? null;

                setAvatar(avatarUrl);
                setAvatarOriginal(avatarUrl);
                setAvatar(cliente.avatar_url ?? null);
            } catch (error) {
                Toast.show({
                    type: "error",
                    text1: "Erro ao carregar cliente",
                });
            } finally {
                setLoading(false);
            }
        };

        carregarCliente();
    }, [clienteId, modo, reset, navigation]);
    const onSubmit = async (data: FormData) => {
        if (!isDirty && !avatarAlterado) {
            return;
        }

        try {
            setSaving(true);

            const payload =
                data.tipo === "pf"
                    ? {
                        tipo: "pf" as const,
                        nome: data.nome,
                        email: data.email,
                        telefone: data.telefone,
                        endereco: data.endereco,
                        pf: data.pf!,
                    }
                    : {
                        tipo: "pj" as const,
                        nome: data.nome,
                        email: data.email,
                        telefone: data.telefone,
                        endereco: data.endereco,
                        pj: data.pj!,
                    };

            if (isCriar) {
                const response = await createCliente(payload);

                const novoCliente = response.data;

                if (avatar) {
                    await updateClienteAvatar(
                        novoCliente.id,
                        avatar
                    );
                }

                Toast.show({
                    type: "success",
                    text1: "Cliente cadastrado",
                    text2: "O cliente foi cadastrado com sucesso.",
                });

                unsavedGuard.permitirProximaSaida();
                navigation.goBack();
                return;
            }

            if (isEditar && clienteId) {
                let dadosAtualizados = false;

                if (isDirty) {
                    await updateCliente(clienteId, payload);
                    dadosAtualizados = true;
                }

                if (avatarAlterado) {
                    if (avatar) {
                        await updateClienteAvatar(clienteId, avatar);
                    } else if (avatarOriginal) {
                        await removeClienteAvatar(clienteId);
                    }

                    dadosAtualizados = true;
                }

                if (dadosAtualizados) {
                    Toast.show({
                        type: "success",
                        text1: "Cliente atualizado",
                        text2: "As alterações foram salvas com sucesso.",
                    });
                }

                reset(data);
                setAvatarOriginal(avatar);
            }
        } catch (error: any) {
            const errosApi = Object.values(error?.response?.data?.errors ?? {})
                .flat()
                .filter((mensagem: unknown): mensagem is string => typeof mensagem === "string");
            Toast.show({
                type: "error",
                text1: errosApi.length ? "Confira os dados do cliente" : "Erro ao salvar cliente",
                text2: errosApi.slice(0, 3).join(" · ")
                    || error?.response?.data?.message
                    || "Não foi possível salvar as alterações.",
            });
        } finally {
            setSaving(false);
        }
    };

    const avisarErrosValidacao = (erros: unknown) => {
        const mensagens = coletarErrosFormulario(erros);
        const visiveis = mensagens.slice(0, 3).join(" · ");
        const restantes = mensagens.length > 3 ? ` · e mais ${mensagens.length - 3} campo(s)` : "";
        Toast.show({
            type: "error",
            text1: isCriar ? "Confira os dados do cliente" : "Confira os campos destacados",
            text2: visiveis ? `${visiveis}${restantes}` : "Preencha os campos obrigatórios antes de continuar.",
        });
    };
    const tipoCliente = watch("tipo");
    const isPF = tipoCliente === "pf";


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
                }
            );

            setValue(
                "endereco.bairro",
                endereco.bairro ?? "",
                {
                    shouldDirty: true,
                    shouldValidate: true,
                }
            );

            setValue(
                "endereco.cidade",
                endereco.localidade ?? "",
                {
                    shouldDirty: true,
                    shouldValidate: true,
                }
            );

            setValue(
                "endereco.estado",
                endereco.uf ?? "",
                {
                    shouldDirty: true,
                    shouldValidate: true,
                }
            );
        } catch (error) {
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
                    Carregando cliente...
                </Text>
            </View>
        );
    }

    return (
        <FormAccessProvider canEdit={formCanEdit}>
        <View style={[styles.container, { backgroundColor: colors.background, },]}>
            <Nav
                title={isCriar ? "Novo Cliente" : "Editar Cliente"}
                subtitle={isPF ? "Pessoa Física" : "Pessoa Jurídica"}
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
                        nome={watch("nome") || "Cliente"}
                        imageUri={avatar}
                        size={120}
                        editable={true}
                        onImageSelected={handleImageSelected}
                        onImageRemoved={handleRemoveAvatar}
                    />

                    <Text style={[styles.avatarLabel, { color: colors.text },]}>
                        Foto do cliente
                    </Text>
                </View>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, },]}>
                        Tipo de cliente
                    </Text>
                    <Text style={[styles.tipoDescricao, { color: colors.muted }]}>
                        {isCriar ? "Escolha como este cliente será cadastrado." : "Tipo definido no cadastro e não pode ser alterado."}
                    </Text>

                    <View
                        style={[styles.tipoContainer, !isCriar && styles.tipoContainerReadOnly]}
                    >
                        <Controller
                            control={control}
                            name="tipo"
                            render={({
                                field: {
                                    value,
                                    onChange,
                                },
                                }) => isCriar ? (
                                    <>
                                        <TouchableOpacity
                                            disabled={!formCanEdit}
                                            activeOpacity={0.8}
                                            accessibilityRole="radio"
                                            accessibilityState={{ checked: value === "pf", disabled: !formCanEdit }}
                                            style={[styles.tipoButton, { backgroundColor: value === "pf" ? colors.primary : colors.surface, borderColor: value === "pf" ? colors.primary : colors.border }]}
                                            onPress={() => {
                                                onChange("pf");
                                                setValue("pj", {
                                                    cnpj: "",
                                                    razao_social: "",
                                                    nome_fantasia: null,
                                                    nome_responsavel: "",
                                                    cpf_responsavel: "",
                                                    cargo_responsavel: null,
                                                });
                                            }}
                                        >
                                            <Text style={[styles.tipoText, { color: value === "pf" ? "#fff" : colors.text }]}>Pessoa Física</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            disabled={!formCanEdit}
                                            activeOpacity={0.8}
                                            accessibilityRole="radio"
                                            accessibilityState={{ checked: value === "pj", disabled: !formCanEdit }}
                                            style={[styles.tipoButton, { backgroundColor: value === "pj" ? colors.primary : colors.surface, borderColor: value === "pj" ? colors.primary : colors.border }]}
                                            onPress={() => {
                                                onChange("pj");
                                                setValue("pf", {
                                                    genero: null,
                                                    rg: "",
                                                    cpf: "",
                                                    data_nascimento: "",
                                                });
                                            }}
                                        >
                                            <Text style={[styles.tipoText, { color: value === "pj" ? "#fff" : colors.text }]}>Pessoa Jurídica</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <View style={[styles.tipoReadOnly, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <View style={[styles.tipoReadOnlyIcon, { backgroundColor: `${colors.primary}20` }]}>
                                            <MaterialCommunityIcons name={value === "pf" ? "account-outline" : "domain"} size={24} color={colors.primary} />
                                        </View>
                                        <View style={styles.tipoReadOnlyCopy}>
                                            <Text style={[styles.tipoReadOnlyCaption, { color: colors.muted }]}>TIPO CADASTRADO</Text>
                                            <Text style={[styles.tipoReadOnlyValue, { color: colors.text }]}>{value === "pf" ? "Pessoa Física" : "Pessoa Jurídica"}</Text>
                                        </View>
                                        <MaterialCommunityIcons name="lock-outline" size={19} color={colors.muted} />
                                    </View>
                                )}
                        />
                    </View>
                </View>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, },]}
                    >
                        Dados principais
                    </Text>

                    <Controller
                        control={control}
                        name="nome"
                        render={({
                            field: { value, onChange },
                            fieldState: { error },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="Nome completo"
                                    placeholder="Digite o nome completo"
                                    value={value}
                                    onChangeText={(text) => {
                                        onChange(
                                            onlyLetters(text, 255)
                                        );
                                    }}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="email"
                        render={({
                            field: {
                                value,
                                onChange,
                            },
                            fieldState: { error },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="E-mail"
                                    placeholder="Digite o e-mail"
                                    value={value ?? ""}
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
                            field: { value, onChange },
                            fieldState: { error },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="Telefone"
                                    placeholder="(00) 00000-0000"
                                    value={formatTelefone(value ?? "")}
                                    editable={true}
                                    tipo="number"
                                    onChangeText={(text) => {
                                        const telefone = onlyNumbers(text, 11);

                                        onChange(telefone);
                                    }}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />
                    {isPF ? (
                        <>
                            <Controller
                                control={control}
                                name="pf.cpf"
                                render={({
                                    field: { value, onChange },
                                    fieldState: { error },
                                }) => (
                                    <>
                                        <EditableTextCard
                                            label="CPF"
                                            placeholder="000.000.000-00"
                                            value={formatCpf(value ?? "")}
                                            editable={true}
                                            tipo="number"
                                            onChangeText={(text) => {
                                                const cpf = onlyNumbers(text, 11);

                                                onChange(cpf);
                                            }}
                                        />

                                        <InputError message={error?.message} />
                                    </>
                                )}
                            />

                            <Controller
                                control={control}
                                name="pf.rg"
                                render={({ field: { value, onChange }, fieldState: { error } }) => (
                                    <>
                                        <EditableTextCard
                                            label="RG"
                                            placeholder="00.000.000-0"
                                            value={formatRg(value ?? "")}
                                            editable={true}
                                            onChangeText={(text) => {
                                                onChange(formatRg(text));
                                            }}
                                        />
                                        <InputError message={error?.message} />
                                    </>
                                )}
                            />

                            <Controller
                                control={control}
                                name="pf.data_nascimento"
                                render={({ field: { value, onChange }, fieldState: { error } }) => (
                                    <>
                                        <DateField
                                            label="Data de nascimento"
                                            value={value}
                                            onChange={onChange}
                                            maximumDate={new Date(Date.now() - 86400000)}
                                        />
                                        <InputError message={error?.message} />
                                    </>
                                )}
                            />

                            <Controller
                                control={control}
                                name="pf.genero"
                                render={({ field: { value, onChange }, fieldState: { error } }) => (
                                    <>
                                        <GeneroSelector
                                            value={value}
                                            onChange={onChange}
                                        />

                                        <InputError message={error?.message} />
                                    </>
                                )}
                            />
                        </>
                    ) : (
                        <>
                            <Controller
                                control={control}
                                name="pj.cnpj"
                                render={({
                                    field: { value, onChange },
                                    fieldState: { error },
                                }) => (
                                    <>
                                        <EditableTextCard
                                            label="CNPJ"
                                            placeholder="00.000.000/0000-00"
                                            value={formatCnpj(value ?? "")}
                                            editable={true}
                                            tipo="number"
                                            onChangeText={(text) => {
                                                const cnpj = onlyNumbers(text, 14);

                                                onChange(cnpj);
                                            }}
                                        />

                                        <InputError message={error?.message} />
                                    </>
                                )}
                            />

                            <Controller
                                control={control}
                                name="pj.razao_social"
                                render={({
                                    field: { value, onChange },
                                    fieldState: { error },
                                }) => (
                                    <>
                                        <EditableTextCard
                                            label="Razão social"
                                            placeholder="Digite a razão social"
                                            value={value ?? ""}
                                            editable={true}
                                            onChangeText={(text) => {
                                                onChange(
                                                    onlyLettersAndNumbers(text, 255)
                                                );
                                            }}
                                        />

                                        <InputError message={error?.message} />
                                    </>
                                )}
                            />

                            <Controller
                                control={control}
                                name="pj.nome_fantasia"
                                render={({ field: { value, onChange } }) => (
                                    <EditableTextCard
                                        label="Nome fantasia"
                                        placeholder="Digite o nome fantasia"
                                        value={value ?? ""}
                                        onChangeText={onChange}
                                        editable={true}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="pj.nome_responsavel"
                                render={({
                                    field: { value, onChange },
                                    fieldState: { error },
                                }) => (
                                    <>
                                        <EditableTextCard
                                            label="Nome do responsável"
                                            placeholder="Digite o nome do responsável"
                                            value={value ?? ""}
                                            editable={true}
                                            onChangeText={(text) => {
                                                onChange(
                                                    onlyLetters(text, 255)
                                                );
                                            }}
                                        />

                                        <InputError message={error?.message} />
                                    </>
                                )}
                            />

                            <Controller
                                control={control}
                                name="pj.cpf_responsavel"
                                render={({
                                    field: { value, onChange },
                                    fieldState: { error },
                                }) => (
                                    <>
                                        <EditableTextCard
                                            label="CPF do responsável"
                                            placeholder="000.000.000-00"
                                            value={formatCpf(value ?? "")}
                                            tipo="number"
                                            editable={true}
                                            onChangeText={(text) => {
                                                const cpf = onlyNumbers(text, 11);

                                                onChange(cpf);
                                            }}
                                        />

                                        <InputError message={error?.message} />
                                    </>
                                )}
                            />

                            <Controller
                                control={control}
                                name="pj.cargo_responsavel"
                                render={({ field: { value, onChange } }) => (
                                    <EditableTextCard
                                        label="Cargo do responsável"
                                        placeholder="Digite o cargo"
                                        value={value ?? ""}
                                        onChangeText={onChange}
                                        editable={true}
                                    />
                                )}
                            />
                        </>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, },]}
                    >
                        Endereço
                    </Text>

                    <Controller
                        control={control}
                        name="endereco.cep"
                        render={({
                            field: { value, onChange },
                            fieldState: { error },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="CEP"
                                    placeholder="00000-000"
                                    value={formatCep(value ?? "")}
                                    editable={true}
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
                                placeholder="Digite o logradouro"
                                value={value}
                                onChangeText={
                                    onChange
                                }
                            />
                        )}
                    />

                    <View style={styles.row}>
                        <Controller
                            control={control}
                            name="endereco.numero"
                            render={({
                                field: { value, onChange },
                                fieldState: { error },
                            }) => (
                                <>
                                    <EditableTextCard
                                        label="Número"
                                        placeholder="Número"
                                        value={value}
                                        width="48%"
                                        onChangeText={(text) => {
                                            onChange(
                                                text
                                                    .replace(
                                                        /[^\p{L}\d\s/-]/gu,
                                                        ""
                                                    )
                                                    .slice(0, 20)
                                            );
                                        }}
                                    />

                                    <InputError message={error?.message} />
                                </>
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
                                    onChangeText={
                                        onChange
                                    }
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
                                onChangeText={
                                    onChange
                                }

                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="endereco.estado"
                        render={({
                            field: { value, onChange },
                            fieldState: { error },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="Estado"
                                    placeholder="UF"
                                    value={value}
                                    editable={true}
                                    onChangeText={(text) => {
                                        const estado = text
                                            .replace(/[^a-zA-Z]/g, "")
                                            .slice(0, 2)
                                            .toUpperCase();

                                        onChange(estado);
                                    }}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />
                </View>
                {isEditar && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Orçamentos do cliente</Text>
                        {!orcamentos.length ? (
                            <Text style={[styles.emptyBudgets, { color: colors.muted }]}>Este cliente ainda não possui orçamentos.</Text>
                        ) : orcamentos.map((orcamento) => (
                            <OrcamentoClienteResumo key={orcamento.id} orcamento={orcamento} />
                        ))}
                    </View>
                )}
                <View style={styles.actionsContainer}>
                    {formCanEdit && <Button
                        title={
                            saving
                                ? "Salvando..."
                                : isCriar
                                    ? "Cadastrar cliente"
                                    : "Salvar alterações"
                        }
                        variant="contained"
                        color="primary"
                        disabled={(isEditar && !isDirty && !avatarAlterado) || saving}
                        onPress={handleSubmit(onSubmit, avisarErrosValidacao)}
                    />}

                    {isEditar && podeExcluir && (
                        <Button
                            title="Excluir cliente"
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
                titulo="Tem certeza que deseja excluir este cliente?"
                onSuccess={confirmarExclusao}
            />
            {unsavedGuard.dialog}
        </View >
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

    tipoContainer: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 10,
    },
    tipoContainerReadOnly: {
        flexDirection: "column",
    },
    tipoDescricao: {
        fontSize: 13,
        lineHeight: 18,
        marginTop: -2,
        marginBottom: 9,
    },

    tipoButton: {
        flex: 1,
        minHeight: 54,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },

    tipoText: {
        fontSize: 15,
        fontWeight: "700",
    },
    tipoReadOnly: {
        width: "100%",
        minHeight: 68,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 13,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
    },
    tipoReadOnlyIcon: {
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13,
    },
    tipoReadOnlyCopy: { flex: 1, gap: 2 },
    tipoReadOnlyCaption: { fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
    tipoReadOnlyValue: { fontSize: 18, lineHeight: 23, fontWeight: "900" },

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
    emptyBudgets: { fontSize: 14, marginTop: 6, paddingVertical: 12 },
});

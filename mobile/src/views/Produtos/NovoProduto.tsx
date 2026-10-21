import GaleriaImagens, {
    ImagemGaleria,
} from "@components/GaleriaImagens";
import Nav from "@components/utilities/Nav";
import EditableTextCard from "@components/EditableTextCard";
import Button from "@components/botoes/Button";
import DialogConfirmarAcao from "@components/dialogs/DialogConfirmarAcao";
import DateField from "@components/DateField";
import { InputError } from "@components/InputError";
import {
    useNavigation,
    useRoute,
    useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

import { Opcao, RootStackParamList } from "@context/types";
import { useTheme } from "@context/ThemeContext";

import {
    adicionarImagemProduto,
    createProduto,
    definirImagemPrincipal,
    deleteProduto,
    getProduto,
    removerImagemProduto,
    substituirImagemPrincipal,
    updateProduto,
} from "@api/apiProdutos";
import Toast from "react-native-toast-message";
import Selector from "@components/Selector";
import { dateFromApi, dateToApi, formatDate, onlyLettersAndNumbers, onlyNumbers, parsePercent, parseReal } from "@core/utils/format";
import { createCategoria, getCategorias, getUnidadesMedida } from "@api/apiCategoria";
import { produtoSchema } from "@schemas/ProdutoSchema";
import { getFornecedores } from "@api/apiFornecedores";
import { useAuth } from "@context/AuthContext";
import { can } from "@utils/permissions";
type Navigation =
    NativeStackNavigationProp<RootStackParamList>;

type FormData = z.input<typeof produtoSchema>;

type Route = NativeStackScreenProps<
    RootStackParamList,
    "NovoProduto"
>["route"];


const imagensIguais = (
    atuais: ImagemGaleria[],
    originais: ImagemGaleria[]
): boolean => {
    if (atuais.length !== originais.length) {
        return false;
    }

    return atuais.every((imagem, index) => {
        const original = originais[index];

        return (
            imagem.id === original.id &&
            imagem.uri === original.uri &&
            imagem.principal === original.principal &&
            imagem.nova === original.nova
        );
    });
};

export default function NovoProduto() {

    const navigation = useNavigation<Navigation>();
    const route = useRoute<Route>();
    const { colors } = useTheme();
    const { user } = useAuth();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [imagens, setImagens] = useState<ImagemGaleria[]>([]);
    const [imagensOriginais, setImagensOriginais] = useState<ImagemGaleria[]>([]);
    const [fornecedores, setFornecedores] = useState<Opcao[]>([]);
    const [carregandoFornecedores, setCarregandoFornecedores] = useState(false);
    const [categorias, setCategorias] = useState<Opcao[]>([]);
    const [carregandoCategorias, setCarregandoCategorias] = useState(false);
    const [unidadesMedida, setUnidadesMedida] = useState<Opcao[]>([]);
    const [saving, setSaving] = useState(false);
    const modo = route.params?.modo ?? "criar";
    const produtoId = route.params?.produtoId;
    const isCriar = modo === "criar";
    const isEditar = modo === "editar";
    const [showCategoriaModal, setShowCategoriaModal] = useState(false);
    const [nomeCategoria, setNomeCategoria] = useState("");
    const [salvandoCategoria, setSalvandoCategoria] = useState(false);
    const imagensAlteradas = !imagensIguais(imagens, imagensOriginais);
    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: {
            isDirty,
        },
    } = useForm<FormData>({
        resolver: zodResolver(produtoSchema),
        mode: "onChange",

        defaultValues: {
            nome: "",
            descricao: "",
            preco_custo: 0,
            porcentagem_lucro: 0,
            preco_venda: 0,
            estoque: 0,
            data_entrada: null,
            validade: null,
            categoria_id: "",
            fornecedor_id: "",
            unidade_medida_id: "",
        },
    });
    const nomeProduto = watch("nome");

    const carregarFornecedores = useCallback(async () => {
        try {
            setCarregandoFornecedores(true);
            const response = await getFornecedores();
            setFornecedores(response.data.map((fornecedor) => ({
                id: String(fornecedor.id),
                nome: fornecedor.nome,
            })));
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao carregar fornecedores",
                text2: error?.response?.data?.message ?? "Não foi possível carregar a lista de fornecedores.",
            });
        } finally {
            setCarregandoFornecedores(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        carregarFornecedores();
    }, [carregarFornecedores]));

    useEffect(() => {
        if (modo === "criar") {
            return;
        }

        if (!produtoId) {
            Toast.show({
                type: "error",
                text1: "Produto não informado",
            });

            navigation.goBack();
            return;
        }

        const carregarDados = async () => {
            try {
                const [
                    produtoResponse,
                    categoriasResponse,
                    unidadesResponse,
                ] = await Promise.all([
                    getProduto(produtoId),
                    getCategorias(),
                    getUnidadesMedida(),
                ]);

                const produto = produtoResponse.data;

                setCategorias(
                    categoriasResponse.data.map((categoria) => ({
                        id: String(categoria.id),
                        nome: categoria.nome,
                    }))
                );

                setUnidadesMedida(
                    unidadesResponse.data.map((unidade) => ({
                        id: String(unidade.id),
                        nome: `${unidade.nome} (${unidade.sigla})`,
                    }))
                );
                const categoriasDisponiveis: Opcao[] =
                    categoriasResponse.data.map((categoria) => ({
                        id: String(categoria.id),
                        nome: categoria.nome,
                    }));

                if (
                    produto.categoria_id &&
                    !categoriasDisponiveis.some(
                        (categoria) =>
                            String(categoria.id) === String(produto.categoria_id)
                    )
                ) {
                    categoriasDisponiveis.push({
                        id: String(produto.categoria_id),
                        nome: produto.categoria_titulo ?? "Categoria",
                    });
                }

                setCategorias(categoriasDisponiveis);

                const unidadesDisponiveis: Opcao[] =
                    unidadesResponse.data.map((unidade) => ({
                        id: String(unidade.id),
                        nome: `${unidade.nome} (${unidade.sigla})`,
                    }));

                if (
                    produto.unidade_medida_id &&
                    !unidadesDisponiveis.some(
                        (unidade) =>
                            String(unidade.id) === String(produto.unidade_medida_id)
                    )
                ) {
                    unidadesDisponiveis.push({
                        id: String(produto.unidade_medida_id),
                        nome: `${produto.unidade_medida_titulo ?? "Unidade"}${produto.unidade_medida_sigla
                            ? ` (${produto.unidade_medida_sigla})`
                            : ""
                            }`,
                    });
                }

                setUnidadesMedida(unidadesDisponiveis);

                const dados: FormData = {
                    nome: produto.nome ?? "",
                    descricao: produto.descricao ?? "",
                    preco_custo: Number(produto.preco_custo ?? 0),
                    porcentagem_lucro: Number(produto.porcentagem_lucro ?? 0),
                    preco_venda: Number(produto.preco_venda ?? 0),
                    estoque: Number(produto.estoque ?? 0),
                    data_entrada: dateFromApi(produto.data_entrada),
                    validade: dateFromApi(produto.validade),
                    categoria_id: produto.categoria_id ? String(produto.categoria_id) : "",
                    fornecedor_id: produto.fornecedor_id ? String(produto.fornecedor_id) : "",
                    unidade_medida_id: produto.unidade_medida_id ? String(produto.unidade_medida_id) : "",
                };

                reset(dados);

                const imagensProduto: ImagemGaleria[] = (produto.imagens ?? []).map(
                    (imagem: any) => ({
                        id: String(imagem.id),
                        uri: imagem.url,
                        principal: Boolean(imagem.principal),
                        nova: false,
                    })
                );

                console.log(
                    'Imagens recebidas pela galeria:',
                    JSON.stringify(imagensProduto, null, 2)
                );

                setImagens(imagensProduto);
                setImagensOriginais(imagensProduto);
            } catch (error: any) {
                Toast.show({
                    type: "error",
                    text1: "Erro ao carregar produto",
                    text2:
                        error?.response?.data?.message ??
                        "Não foi possível carregar os dados do produto.",
                });

                navigation.goBack();
            }
        };

        carregarDados();
    }, [modo, produtoId, navigation, reset]);


    const carregarCategorias = async () => {
        try {
            setCarregandoCategorias(true);

            const response = await getCategorias();

            setCategorias(
                response.data.map((categoria) => ({
                    id: String(categoria.id),
                    nome: categoria.nome,
                }))
            );
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao carregar categorias",
                text2:
                    error?.response?.data?.message ??
                    "Não foi possível carregar as categorias.",
            });
        } finally {
            setCarregandoCategorias(false);
        }
    };

    const carregarUnidadesMedida = async () => {
        if (unidadesMedida.length > 0) { return; }
        try {
            const response = await getUnidadesMedida();
            setUnidadesMedida(
                response.data.map((unidade) => ({
                    id: String(unidade.id),
                    nome: `${unidade.nome} (${unidade.sigla})`,
                }))
            );
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao carregar unidades de medida",
                text2:
                    error?.response?.data?.message ??
                    "Não foi possível carregar as unidades.",
            });
        }
    };

    const handleDelete = () => {
        if (!produtoId) {
            return;
        }
        setShowDeleteDialog(true);
    };

    const handleCreateCategoria = async () => {
        const nome = nomeCategoria.trim();

        if (!nome) {
            Toast.show({
                type: "error",
                text1: "Nome obrigatório",
                text2: "Informe o nome da categoria.",
            });
            return;
        }

        try {
            setSalvandoCategoria(true);
            const response = await createCategoria(nome);
            const novaCategoria = response.data;
            const opcao: Opcao = {
                id: String(novaCategoria.id),
                nome: novaCategoria.nome,
            };

            setCategorias((anteriores) => [
                ...anteriores,
                opcao,
            ]);

            setValue("categoria_id", opcao.id!, {
                shouldDirty: true,
                shouldValidate: true,
            });

            setNomeCategoria("");
            setShowCategoriaModal(false);

            Toast.show({
                type: "success",
                text1: "Categoria cadastrada",
                text2: "A categoria foi criada e selecionada.",
            });
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao cadastrar categoria",
                text2:
                    error?.response?.data?.message ??
                    "Não foi possível cadastrar a categoria.",
            });
        } finally {
            setSalvandoCategoria(false);
        }
    };
    const confirmarExclusao = async () => {
        if (!produtoId) {
            return;
        }

        try {
            setSaving(true);
            await deleteProduto(produtoId);
            Toast.show({
                type: "success",
                text1: "Produto excluído",
                text2: "O produto foi removido com sucesso.",
            });
            navigation.goBack();
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao excluir",
                text2: error?.response?.data?.message ?? "Não foi possível excluir o produto.",
            });
        } finally {
            setSaving(false);
            setShowDeleteDialog(false);
        }
    };

    const sincronizarGaleria = async (id: string) => {
        const imagensRemovidas = imagensOriginais.filter(
            (original) =>
                !imagens.some((atual) => atual.id === original.id)
        );

        for (const imagem of imagensRemovidas) {
            await removerImagemProduto(id, imagem.id);
        }

        const imagensNovas = imagens.filter(
            (imagem) => imagem.nova && !imagem.principal
        );

        for (const imagem of imagensNovas) {
            await adicionarImagemProduto(
                id,
                imagem.uri,
                false
            );
        }

        const principal = imagens.find(
            (imagem) => imagem.principal
        );

        if (!principal) {
            return;
        }

        if (principal.nova) {
            await adicionarImagemProduto(
                id,
                principal.uri,
                true
            );

            return;
        }

        const principalOriginal = imagensOriginais.find(
            (imagem) => imagem.id === principal.id
        );

        if (
            principalOriginal &&
            !principalOriginal.principal
        ) {
            await definirImagemPrincipal(
                id,
                principal.id
            );
        }
    };


    const onSubmit = async (data: FormData) => {
        if (
            !isCriar &&
            !isDirty &&
            !imagensAlteradas
        ) {
            return;
        }

        try {
            setSaving(true);

            const payload = {
                nome: data.nome,
                descricao: data.descricao || null,
                preco_custo: data.preco_custo,
                porcentagem_lucro: data.porcentagem_lucro,
                preco_venda: data.preco_venda,
                estoque: data.estoque,
                data_entrada: dateToApi(data.data_entrada),
                validade: dateToApi(data.validade),
                categoria_id: data.categoria_id,
                fornecedor_id: data.fornecedor_id || null,
                unidade_medida_id: data.unidade_medida_id,
            };

            if (isCriar) {
                const response = await createProduto(payload);

                const novoProdutoId = response.data.id;

                if (imagens.length > 0) {
                    const imagensOrdenadas = [
                        ...imagens.filter((imagem) => !imagem.principal),
                        ...imagens.filter((imagem) => imagem.principal),
                    ];

                    console.log(
                        `[Galeria] Total de imagens: ${imagensOrdenadas.length}`
                    );

                    for (let index = 0; index < imagensOrdenadas.length; index++) {
                        const imagem = imagensOrdenadas[index];

                        console.log(
                            `[Galeria] Enviando imagem ${index + 1}/${imagensOrdenadas.length}`,
                            {
                                uri: imagem.uri,
                                principal: imagem.principal,
                                nova: imagem.nova,
                            }
                        );

                        try {
                            const response = await adicionarImagemProduto(
                                novoProdutoId,
                                imagem.uri,
                                imagem.principal
                            );

                            console.log(
                                `[Galeria] Imagem ${index + 1} enviada com sucesso`,
                                response
                            );
                        } catch (error: any) {
                            console.error(
                                `[Galeria] Falha na imagem ${index + 1}`,
                                {
                                    status: error?.response?.status,
                                    data: error?.response?.data,
                                    message: error?.message,
                                    code: error?.code,
                                    uri: imagem.uri,
                                }
                            );

                            throw error;
                        }
                    }
                }

                Toast.show({
                    type: "success",
                    text1: "Produto cadastrado",
                    text2: "Produto e galeria salvos com sucesso.",
                });

                navigation.goBack();
                return;
            }

            if (isEditar && produtoId) {
                if (isDirty) {
                    await updateProduto(produtoId, payload);
                }

                if (imagensAlteradas) {
                    await sincronizarGaleria(produtoId);
                }

                const produtoAtualizado = await getProduto(produtoId);

                const imagensAtualizadas: ImagemGaleria[] = (
                    produtoAtualizado.data.imagens ?? []
                ).map((imagem: any) => ({
                    id: String(imagem.id),
                    uri: imagem.url,
                    principal: Boolean(imagem.principal),
                    nova: false,
                }));

                setImagens(imagensAtualizadas);
                setImagensOriginais(imagensAtualizadas);

                Toast.show({
                    type: "success",
                    text1: "Produto atualizado",
                    text2: "Alterações salvas com sucesso.",
                });

                reset(data);
            }
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Erro ao salvar produto",
                text2:
                    error?.response?.data?.message ??
                    "Não foi possível salvar as alterações.",
            });
        } finally {
            setSaving(false);
        }
    };

    const custo = watch("preco_custo");
    const lucro = watch("porcentagem_lucro");

    useEffect(() => {
        const venda = Number((custo * (1 + lucro / 100)).toFixed(2));

        setValue("preco_venda", venda, {
            shouldValidate: true,
        });
    }, [custo, lucro, setValue]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background, },]}>
            <Nav title={isCriar ? "Novo Produto" : "Editar Produto"}
                subtitle="Produto"
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
                <View style={styles.section}>
                    <GaleriaImagens
                        imagens={imagens}
                        onChange={setImagens}
                        editable={true}
                        maxImagens={10}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, },]}>
                        Dados principais
                    </Text>

                    <Controller
                        control={control}
                        name="nome"
                        render={({ field: { value, onChange, }, fieldState: { error, },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="Nome do produto"
                                    placeholder="Digite o nome do produto"
                                    value={value}
                                    onChangeText={(text) =>
                                        onChange(onlyLettersAndNumbers(text, 255))
                                    }
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="descricao"
                        render={({ field: { value, onChange, }, fieldState: { error, },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="Descrição"
                                    placeholder="Digite a descrição do produto"
                                    value={value ?? ""}
                                    onChangeText={(text) => onChange(text.slice(0, 1000))}
                                />
                                <InputError message={error?.message} />
                            </>
                        )}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, },]}>
                        Valores
                    </Text>

                    <Controller
                        control={control}
                        name="preco_custo"
                        render={({
                            field: { value, onChange, },
                            fieldState: { error, },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="Preço de custo"
                                    placeholder="0,00"
                                    value={value === null || value === undefined ? '0,00' : String(value).replace('.', ',')}
                                    tipo="number"
                                    money
                                    onChangeText={(text) => {
                                        const valor = parseReal(text);
                                        onChange(Number.isNaN(valor) ? 0 : valor,);
                                    }}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="porcentagem_lucro"
                        render={({
                            field: { value, onChange, },
                            fieldState: { error, },
                        }) => (
                            <>
                                <EditableTextCard
                                    label="Porcentagem de lucro (%)"
                                    placeholder="0"
                                    value={value === null || value === undefined ? "" : String(value).replace(".", ",")}
                                    tipo="number"
                                    onChangeText={(text) => {
                                        const valor = parsePercent(text);
                                        onChange(Number.isNaN(valor) ? 0 : valor);
                                    }}
                                />
                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="preco_venda"
                        render={({ field: { value }, fieldState: { error } }) => (
                            <>
                                <EditableTextCard
                                    label="Preço de venda"
                                    placeholder="0,00"
                                    value={value === null || value === undefined ? "" : String(value).replace(".", ",")}
                                    tipo="number"
                                    editable={false}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />
                </View>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, },]}>
                        Estoque
                    </Text>

                    <View style={styles.row}>
                        <View style={styles.half} >
                            <Controller
                                control={control}
                                name="estoque"
                                render={({
                                    field: { value, onChange, },
                                    fieldState: { error, },
                                }) => (
                                    <>
                                        <EditableTextCard
                                            label="Estoque"
                                            placeholder="0"
                                            value={String(value ?? "")}
                                            tipo="number"
                                            onChangeText={(text) => {
                                                const valor = onlyNumbers(text);
                                                onChange(valor === "" ? 0 : Number(valor));
                                            }}
                                        />

                                        <InputError message={error?.message} />
                                    </>
                                )}
                            />
                        </View>

                        <View style={styles.half}>
                            <Controller
                                control={control}
                                name="unidade_medida_id"
                                render={({
                                    field: { value, onChange },
                                    fieldState: { error },
                                }) => (
                                    <>
                                        <Selector
                                            label="Unidade"
                                            placeholder="Selecionar"
                                            value={value}
                                            options={unidadesMedida}
                                            onChange={onChange}
                                            onOpen={carregarUnidadesMedida}
                                        />

                                        <InputError message={error?.message} />
                                    </>
                                )}
                            />
                        </View>
                    </View>
                </View>


                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, },]}>
                        Classificação
                    </Text>

                    <Controller
                        control={control}
                        name="categoria_id"
                        render={({
                            field: { value, onChange },
                            fieldState: { error },
                        }) => (
                            <>
                                <Selector
                                    label="Categoria"
                                    placeholder={
                                        carregandoCategorias
                                            ? "Carregando categorias..."
                                            : "Selecionar categoria"
                                    }
                                    value={value}
                                    options={categorias}
                                    onChange={onChange}
                                    onOpen={carregarCategorias}
                                    showAddButton
                                    onAdd={() => setShowCategoriaModal(true)}
                                />

                                <InputError message={error?.message} />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="fornecedor_id"
                        render={({
                            field: { value, onChange, },
                            fieldState: { error, },
                        }) => (
                            <>
                                <Selector
                                    label="Fornecedor"
                                    placeholder={carregandoFornecedores
                                        ? "Carregando fornecedores..."
                                        : fornecedores.length
                                            ? "Selecionar fornecedor"
                                            : "Nenhum fornecedor cadastrado"}
                                    value={value}
                                    options={fornecedores}
                                    loading={carregandoFornecedores}
                                    onChange={onChange}
                                    onOpen={carregarFornecedores}
                                    showAddButton={can(user, "fornecedores.criar")}
                                    onAdd={can(user, "fornecedores.criar")
                                        ? () => navigation.navigate("NovoFornecedor", { modo: "criar" })
                                        : undefined}
                                />
                                <InputError message={error?.message} />
                            </>
                        )}
                    />
                </View>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text, },]} >
                        Datas
                    </Text>

                    <Controller
                        control={control}
                        name="data_entrada"
                        render={({
                            field: { value, onChange, },
                            fieldState: { error, },
                        }) => (
                            <><DateField
                                label="Data de entrada"
                                value={value ?? ""}
                                onChange={(text) => onChange(formatDate(text))}
                            />
                                <InputError message={error?.message}
                                />
                            </>
                        )}
                    />

                    <Controller
                        control={control}
                        name="validade"
                        render={({
                            field: { value, onChange, },
                            fieldState: { error, },
                        }) => (
                            <>
                                <DateField
                                    label="Validade"
                                    value={value ?? ""}
                                    onChange={(text) => onChange(formatDate(text))}
                                />
                                <InputError message={error?.message}
                                />
                            </>
                        )}
                    />
                </View>
                <View style={styles.actionsContainer}>
                    <Button
                        title={
                            saving
                                ? "Salvando..."
                                : isCriar
                                    ? "Cadastrar produto"
                                    : "Salvar alterações"
                        }
                        variant="contained"
                        color="primary"
                        disabled={
                            (!isCriar && !isDirty && !imagensAlteradas) ||
                            saving
                        }
                        onPress={handleSubmit(onSubmit)}
                    />

                    {isEditar && (
                        <Button
                            title="Excluir produto"
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
                titulo="Tem certeza que deseja excluir este produto?"
                onSuccess={confirmarExclusao}
            />
            <Modal
                visible={showCategoriaModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!salvandoCategoria) {
                        setShowCategoriaModal(false);
                    }
                }}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => {
                        if (!salvandoCategoria) {
                            setShowCategoriaModal(false);
                        }
                    }}
                >
                    <Pressable
                        style={styles.modalContainer}
                        onPress={(event) => event.stopPropagation()}
                    >
                        <Text style={styles.modalTitle}>
                            Nova categoria
                        </Text>

                        <Text style={styles.modalDescription}>
                            Informe o nome da categoria que deseja cadastrar.
                        </Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ex.: Bebidas"
                            placeholderTextColor="#777"
                            value={nomeCategoria}
                            onChangeText={(texto) =>
                                setNomeCategoria(texto.slice(0, 255))
                            }
                            maxLength={255}
                            autoCapitalize="sentences"
                            editable={!salvandoCategoria}
                            returnKeyType="done"
                            onSubmitEditing={handleCreateCategoria}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.cancelButton,
                                ]}
                                disabled={salvandoCategoria}
                                onPress={() => {
                                    setShowCategoriaModal(false);
                                    setNomeCategoria("");
                                }}
                            >
                                <Text style={styles.cancelButtonText}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.saveButton,
                                    salvandoCategoria && styles.disabledButton,
                                ]}
                                disabled={salvandoCategoria}
                                onPress={handleCreateCategoria}
                            >
                                <Text style={styles.saveButtonText}>
                                    {salvandoCategoria
                                        ? "Salvando..."
                                        : "Cadastrar"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
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

    half: {
        width: "48%",
    },

    actionsContainer: {
        alignItems: "center",
        width: "100%",
        gap: 12,
        marginBottom: 5,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    modalContainer: {
        width: "100%",
        maxWidth: 400,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 22,
    },

    modalTitle: {
        fontSize: 21,
        fontWeight: "700",
        color: "#062046",
        marginBottom: 8,
    },

    modalDescription: {
        fontSize: 14,
        color: "#666",
        marginBottom: 20,
        lineHeight: 20,
    },

    modalInput: {
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: "#111",
        marginBottom: 20,
    },

    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
    },

    modalButton: {
        minWidth: 105,
        minHeight: 44,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    cancelButton: {
        backgroundColor: "#EEEEEE",
    },

    cancelButtonText: {
        color: "#333",
        fontSize: 14,
        fontWeight: "600",
    },

    saveButton: {
        backgroundColor: "#062046",
    },

    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },

    disabledButton: {
        opacity: 0.6,
    },
});

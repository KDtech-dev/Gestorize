import { getAxios } from "@configs/axios";
import {
    ArrayResponseType,
    ProdutoType,
    ResponseType,
} from "@context/types";

import { produtoSchema } from "@schemas/ProdutoSchema";
import { z } from "zod";

const getProdutos = async (): Promise<
    ArrayResponseType<ProdutoType>
> => {
    const response = await getAxios().get("/produtos");

    return response.data;
};

export type EtiquetaOperationType = 'pendentes' | 'todos' | 'selecionados' | 'reimpressao';
export type EtiquetaOperationItemInput = { produto_id: string; quantidade: number };
export type EtiquetaOperation = {
    id: string;
    tipo: EtiquetaOperationType;
    status: 'aguardando_confirmacao' | 'concluida' | 'cancelada' | 'falhou';
    total_produtos: number;
    total_etiquetas: number;
    usuario_nome?: string | null;
    erro?: string | null;
    created_at: string;
    updated_at?: string;
  itens: Array<{ produto_id: string | null; produto_nome: string; codigo_barras: string | null; categoria_nome?: string | null; fornecedor_nome?: string | null; unidade_sigla?: string | null; preco_venda?: number | string | null; assinatura?: string; quantidade: number }>;
};

const chaveIdempotencia = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
});

const getProdutosEtiquetas = async (): Promise<ArrayResponseType<ProdutoType>> =>
    (await getAxios().get('/etiquetas/produtos')).data;

const getHistoricoEtiquetas = async (): Promise<ResponseType<EtiquetaOperation[]>> =>
    (await getAxios().get('/etiquetas/historico')).data;

const criarOperacaoEtiquetas = async (
    tipo: EtiquetaOperationType,
    itens: EtiquetaOperationItemInput[] = [],
    idempotencyKey = chaveIdempotencia(),
): Promise<ResponseType<EtiquetaOperation>> => (await getAxios().post('/etiquetas/operacoes', {
    tipo,
    itens,
    idempotency_key: idempotencyKey,
})).data;

const concluirOperacaoEtiquetas = async (id: string): Promise<ResponseType<EtiquetaOperation>> =>
    (await getAxios().post(`/etiquetas/operacoes/${id}/concluir`)).data;

const cancelarOperacaoEtiquetas = async (id: string): Promise<ResponseType<EtiquetaOperation>> =>
    (await getAxios().post(`/etiquetas/operacoes/${id}/cancelar`)).data;

const getProduto = async (
    id: string | undefined
): Promise<ResponseType<ProdutoType>> => {
    const response = await getAxios().get(`/produtos/${id}`);

    return response.data;
};

const createProduto = async (
    data: z.infer<typeof produtoSchema>
): Promise<ResponseType<ProdutoType>> => {
    const response = await getAxios().post(
        "/produtos",
        data
    );

    return response.data;
};

const updateProduto = async (
    id: string,
    data: Partial<z.infer<typeof produtoSchema>>
): Promise<ResponseType<ProdutoType>> => {
    const response = await getAxios().put(
        `/produtos/${id}`,
        data
    );

    return response.data;
};

const deleteProduto = async (
    id: string
): Promise<ResponseType<null>> => {
    const response = await getAxios().delete(
        `/produtos/${id}`
    );

    return response.data;
};

const substituirImagemPrincipal = async (
    id: string,
    uri: string
): Promise<ResponseType<any>> => {
    const formData = new FormData();

    formData.append("imagem", {
        uri,
        name: `produto-${id}-${Date.now()}.jpg`,
        type: "image/jpeg",
    } as any);

    const response = await getAxios({
        contentType: "formData",
    }).post(
        `/produtos/${id}/imagem/principal`,
        formData
    );

    return response.data;
};

const adicionarImagemProduto = async (
    produtoId: string,
    uri: string,
    principal: boolean = false
) => {
    const extensao = uri
        .split("?")[0]
        .split(".")
        .pop()
        ?.toLowerCase();

    const tiposMime: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        heic: "image/heic",
        heif: "image/heif",
    };

    const extensaoValida =
        extensao && tiposMime[extensao]
            ? extensao
            : "jpg";

    const tipoMime =
        tiposMime[extensaoValida];

    const formData = new FormData();

    formData.append("imagem", {
        uri,
        name: `produto-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${extensaoValida}`,
        type: tipoMime,
    } as any);

    formData.append(
        "principal",
        principal ? "1" : "0"
    );

    const response = await getAxios({
        contentType: "formData",
    }).post(
        `/produtos/${produtoId}/imagem`,
        formData
    );

    return response.data;
};
const removerImagemProduto = async (
    produtoId: string,
    imagemId: string
) => {
    const response = await getAxios().delete(
        `/produtos/${produtoId}/imagem`,
        {
            data: {
                imagem_id: imagemId,
            },
        }
    );

    return response.data;
};

const definirImagemPrincipal = async (
    produtoId: string,
    imagemId: string
) => {
    const response = await getAxios().put(
        `/produtos/${produtoId}/imagem/principal`,
        {
            imagem_id: imagemId,
        }
    );

    return response.data;
};
export {
    getProdutos,
    getProduto,
    createProduto,
    updateProduto,
    deleteProduto,
    adicionarImagemProduto,
    removerImagemProduto,
    definirImagemPrincipal,
    substituirImagemPrincipal,
    getProdutosEtiquetas,
    getHistoricoEtiquetas,
    criarOperacaoEtiquetas,
    concluirOperacaoEtiquetas,
    cancelarOperacaoEtiquetas,
};

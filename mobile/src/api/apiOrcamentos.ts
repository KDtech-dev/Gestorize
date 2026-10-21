import { getAxios } from "@configs/axios";
import { ArrayResponseType, OrcamentoType, ResponseType } from "@context/types";

export type OrcamentoPayload = {
  titulo: string;
  cliente_id: string;
  itens: OrcamentoItemPayload[];
};

export type OrcamentoItemPayload = {
  produto_id: string;
  quantidade: number;
};

const getOrcamentos = async (): Promise<ArrayResponseType<OrcamentoType>> => {
  const response = await getAxios().get("/orcamentos");
  return response.data;
};

const getOrcamento = async (id: string): Promise<ResponseType<OrcamentoType>> => {
  const response = await getAxios().get(`/orcamentos/${id}`);
  return response.data;
};

const createOrcamento = async (
  data: OrcamentoPayload,
): Promise<ResponseType<OrcamentoType>> => {
  const response = await getAxios().post("/orcamentos", data);
  return response.data;
};

const updateOrcamento = async (
  id: string,
  data: Partial<OrcamentoPayload>,
): Promise<ResponseType<OrcamentoType>> => {
  const response = await getAxios().put(`/orcamentos/${id}`, data);
  return response.data;
};

const deleteOrcamento = async (id: string): Promise<ResponseType<null>> => {
  const response = await getAxios().delete(`/orcamentos/${id}`);
  return response.data;
};

const aprovarOrcamento = async (id: string): Promise<ResponseType<OrcamentoType>> => {
  const response = await getAxios().patch(`/orcamentos/${id}/aprovar`);
  return response.data;
};

export { getOrcamentos, getOrcamento, createOrcamento, updateOrcamento, deleteOrcamento, aprovarOrcamento };

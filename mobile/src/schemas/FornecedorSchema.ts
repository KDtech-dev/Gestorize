import { z } from "zod";
import { enderecoSchema } from "./EnderecoSchema";

const onlyNumbers = (value: string) =>
    value.replace(/\D/g, "");

export const fornecedorSchema = z.object({
    nome: z
        .string()
        .min(1, "Informe o nome do fornecedor")
        .max(255, "Nome muito longo"),

    cnpj: z
        .string()
        .transform(onlyNumbers)
        .pipe(
            z.string().length(14, "CNPJ inválido")
        ),

    email: z
        .string()
        .email("E-mail inválido")
        .or(z.literal(""))
        .nullable()
        .optional(),

    telefone: z
        .string()
        .max(20, "Telefone muito longo")
        .nullable()
        .optional(),

    categoria_ids: z.array(z.string()).default([]),

    nome_responsavel: z
        .string()
        .max(255, "Nome do responsável muito longo")
        .nullable()
        .optional(),

    chave_pix: z
        .string()
        .max(255, "Chave PIX muito longa")
        .nullable()
        .optional(),

    endereco: enderecoSchema,
});

export type FornecedorFormData = z.infer<
    typeof fornecedorSchema
>;

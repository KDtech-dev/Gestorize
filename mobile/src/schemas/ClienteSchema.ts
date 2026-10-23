import { z } from "zod";
import { enderecoSchema } from "./EnderecoSchema";

const onlyNumbers = (value: string) =>
  value.replace(/\D/g, "");

const normalizarRg = (value: string) =>
  value.replace(/[^0-9x]/gi, "").toUpperCase();

const generoSchema = z.enum([
  "masculino",
  "feminino",
  "outro",
]);

const pfSchema = z.object({
  genero: generoSchema
    .nullable()
    .optional(),

  rg: z
    .string()
    .transform(normalizarRg)
    .pipe(z.string()
      .min(5, "Informe um RG com pelo menos 5 caracteres")
      .max(14, "RG muito longo")
      .regex(/^\d{4,13}[0-9X]$/, "RG inválido. Use números e, se houver, X no final")),

  cpf: z
    .string()
    .transform(onlyNumbers)
    .pipe(
      z.string().length(11, "CPF inválido")
    ),

  data_nascimento: z
    .string()
    .min(1, "Informe a data de nascimento"),
});

const pjSchema = z.object({
  cnpj: z
    .string()
    .transform(onlyNumbers)
    .pipe(
      z.string().length(14, "CNPJ inválido")
    ),

  razao_social: z
    .string()
    .min(1, "Informe a razão social")
    .max(255, "Razão social muito longa"),

  nome_fantasia: z
    .string()
    .max(255, "Nome fantasia muito longo")
    .nullable()
    .optional(),

  nome_responsavel: z
    .string()
    .min(1, "Informe o responsável")
    .max(255, "Nome do responsável muito longo"),

  cpf_responsavel: z
    .string()
    .transform(onlyNumbers)
    .pipe(
      z.string().length(
        11,
        "CPF do responsável inválido"
      )
    ),

  cargo_responsavel: z
    .string()
    .max(100, "Cargo muito longo")
    .nullable()
    .optional(),
});

const baseSchema = {
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome")
    .max(255, "Nome muito longo"),

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

  endereco: enderecoSchema,
};

export const clienteSchema = z.discriminatedUnion(
  "tipo",
  [
    z.object({
      ...baseSchema,

      tipo: z.literal("pf"),

      pf: pfSchema,
    }),

    z.object({
      ...baseSchema,

      tipo: z.literal("pj"),

      pj: pjSchema,
    }),
  ]
);

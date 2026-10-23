import { z } from "zod";

const somenteNumeros = (value: unknown): unknown => {
    if (typeof value !== "string") {
        return value;
    }

    return value.replace(/\D/g, "");
};

const telefoneSchema = z.preprocess(
    somenteNumeros,
    z
        .string()
        .refine(
            (value) => value === "" || value.length === 10 || value.length === 11,
            "Informe um telefone válido com DDD."
        )
        .or(z.literal(""))
        .nullable()
);

const cpfSchema = z.preprocess(
    somenteNumeros,
    z
        .string()
        .refine(
            (value) => value.length === 11,
            "O CPF deve conter 11 dígitos."
        )
);

const dataNascimentoSchema = z
    .string()
    .trim()
    .refine(
        (value) => {
            if (value === "") {
                return true;
            }

            if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                return false;
            }

            const [dia, mes, ano] = value.split("/").map(Number);
            const data = new Date(ano, mes - 1, dia);

            return (
                data.getFullYear() === ano &&
                data.getMonth() === mes - 1 &&
                data.getDate() === dia
            );
        },
        {
            message: "Informe uma data válida no formato DD/MM/AAAA.",
        }
    )
    .nullable();


export const funcionarioSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, "O nome é obrigatório.")
            .max(255, "O nome deve ter no máximo 255 caracteres."),

        email: z
            .string()
            .trim()
            .min(1, "O e-mail é obrigatório.")
            .email("Informe um e-mail válido.")
            .max(255, "O e-mail deve ter no máximo 255 caracteres."),

        password: z
            .string()
            .default(""),

        password_confirmation: z
            .string()
            .default(""),

        telefone: telefoneSchema,

        cpf: cpfSchema,

        data_nascimento: dataNascimentoSchema,

        role: z.enum(
            ["gestor", "funcionario"],
            {
                message: "Selecione um perfil.",
            }
        ),

        permissions: z
            .array(z.string())
            .default([]),
    })
    .superRefine((data, ctx) => {
        const senhaInformada = data.password.length > 0;
        const confirmacaoInformada =
            data.password_confirmation.length > 0;

        if (senhaInformada && data.password.length < 8) {
            ctx.addIssue({
                code: "custom",
                path: ["password"],
                message: "A senha deve ter pelo menos 8 caracteres.",
            });
        }

        if (senhaInformada && !confirmacaoInformada) {
            ctx.addIssue({
                code: "custom",
                path: ["password_confirmation"],
                message: "Confirme a senha.",
            });
        }

        if (
            confirmacaoInformada &&
            data.password !== data.password_confirmation
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["password_confirmation"],
                message: "As senhas não correspondem.",
            });
        }
    });

export type FuncionarioFormData = z.input<
    typeof funcionarioSchema
>;

export type FuncionarioValidatedData = z.output<
    typeof funcionarioSchema
>;

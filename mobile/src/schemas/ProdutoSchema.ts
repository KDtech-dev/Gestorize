import { z } from "zod";

const dateToIso = (value: string | null | undefined) => {
  if (!value) return null;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

const produtoSchema = z.object({
  nome: z
    .string()
    .min(1, "O nome do produto é obrigatório.")
    .max(255, "O nome do produto deve ter no máximo 255 caracteres."),

  codigos_barras: z.string().max(1600).optional().default(''),

  descricao: z
    .string()
    .nullable()
    .optional(),

  preco_custo: z
    .number({
      message: "O preço de custo deve ser informado.",
    })
    .min(0, "O preço de custo não pode ser negativo."),

  porcentagem_lucro: z
    .number({
      message: "A porcentagem de lucro deve ser informada.",
    })
    .min(0, "A porcentagem de lucro não pode ser negativa."),

  preco_venda: z
    .number({
      message: "O preço de venda deve ser informado.",
    })
    .min(0, "O preço de venda não pode ser negativo."),

  estoque: z
    .number({
      message: "O estoque deve ser informado.",
    })
    .min(0, "O estoque não pode ser negativo."),

  data_entrada: z.string().nullable(),
  validade: z.string().nullable(),

  categoria_id: z
    .string()
    .nullable()
    .optional(),
  categoria_nome: z.string().optional(),

  fornecedor_id: z
    .string()
    .nullable()
    .optional(),

  unidade_medida_id: z
    .string()
    .min(1, "A unidade de medida é obrigatória."),

}).superRefine((produto, ctx) => {
  if (!produto.data_entrada) ctx.addIssue({ code: 'custom', path: ['data_entrada'], message: 'A data de entrada é obrigatória.' });
  const categoria = produto.categoria_nome;
  const exigeValidade = ['insumos', 'produtos médicos/hospitalares'].includes(
    (categoria ?? '').normalize('NFC').toLocaleLowerCase('pt-BR'),
  );
  if (exigeValidade && !produto.validade) {
    ctx.addIssue({ code: 'custom', path: ['validade'], message: 'A validade é obrigatória para esta categoria.' });
  }
  const entrada = dateToIso(produto.data_entrada);
  const validade = dateToIso(produto.validade);
  if (validade && entrada && validade < entrada) {
    ctx.addIssue({ code: 'custom', path: ['validade'], message: 'A validade não pode ser anterior à data de entrada.' });
  }
  if (validade && validade < new Date().toISOString().slice(0, 10)) {
    ctx.addIssue({ code: 'custom', path: ['validade'], message: 'Não é possível cadastrar um produto vencido.' });
  }
});

export { produtoSchema };

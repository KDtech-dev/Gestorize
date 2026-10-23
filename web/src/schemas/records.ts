import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.');

export const fornecedorSchema = z.object({
  nome: z.string().min(1, 'O nome do fornecedor é obrigatório.').max(255),
  cnpj: z.string().min(1, 'O CNPJ é obrigatório.'),
  email: z.string().email('Informe um e-mail válido.').or(z.literal('')).nullable().optional(),
  telefone: z.string().max(20).nullable().optional(),
  categoria_ids: z.array(z.string().uuid()).default([]),
});

export const produtoSchema = z.object({
  nome: z.string().min(1, 'O nome do produto é obrigatório.').max(255),
  preco_custo: z.number().min(0),
  porcentagem_lucro: z.number().min(0),
  preco_venda: z.number().min(0),
  estoque: z.number().min(0),
  data_entrada: isoDate,
  validade: z.union([isoDate, z.literal(''), z.null()]).optional(),
  categoria_id: z.string().uuid().nullable().optional(),
}).superRefine((produto, ctx) => {
  const validade = produto.validade || null;
  const hoje = new Date();
  const today = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  if (validade && validade < produto.data_entrada) ctx.addIssue({ code: 'custom', path: ['validade'], message: 'A validade não pode ser anterior à data de entrada.' });
  if (validade && validade < today) ctx.addIssue({ code: 'custom', path: ['validade'], message: 'Não é possível cadastrar um produto vencido.' });
});

export function validadeObrigatoria(schemaData: z.infer<typeof produtoSchema>, categoriaNome: string | undefined) {
  return ['insumos', 'produtos médicos/hospitalares'].includes((categoriaNome ?? '').toLocaleLowerCase('pt-BR')) && !schemaData.validade;
}

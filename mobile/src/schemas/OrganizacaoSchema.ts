import { z } from 'zod';

const apenasNumeros = (value: string) => value.replace(/\D/g, '');

export const organizacaoSchema = (isEdit: boolean) => z.object({
  name: z.string().trim().min(1, 'Informe o nome da organização.').max(255, 'O nome deve ter no máximo 255 caracteres.'),
  document: z.string().optional().refine((value) => !value?.trim() || apenasNumeros(value).length === 14, 'Informe um CNPJ válido com 14 dígitos.'),
  email: z.string().optional().refine((value) => !value?.trim() || z.email().safeParse(value.trim()).success, 'Informe um e-mail válido.'),
  phone: z.string().max(20, 'O telefone deve ter no máximo 20 caracteres.').optional(),
  managerName: z.string().optional(),
  managerEmail: z.string().optional().refine((value) => !value?.trim() || z.email().safeParse(value.trim()).success, 'Informe um e-mail válido para o gestor.'),
  managerPassword: z.string().optional(),
  managerCpf: z.string().optional().refine((value) => !value?.trim() || apenasNumeros(value).length === 11, 'O CPF deve conter 11 dígitos.'),
  managerId: z.string().optional(),
}).superRefine((data, context) => {
  if (isEdit) return;
  if (!data.managerName?.trim()) context.addIssue({ code: 'custom', path: ['managerName'], message: 'Informe o nome do gestor.' });
  if (!data.managerEmail?.trim()) context.addIssue({ code: 'custom', path: ['managerEmail'], message: 'Informe o e-mail do gestor.' });
  if (!data.managerPassword || data.managerPassword.length < 8) context.addIssue({ code: 'custom', path: ['managerPassword'], message: 'A senha deve ter pelo menos 8 caracteres.' });
  if (!data.managerCpf?.trim()) context.addIssue({ code: 'custom', path: ['managerCpf'], message: 'Informe o CPF do gestor.' });
});

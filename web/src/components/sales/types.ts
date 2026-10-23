export type PaymentMethod = 'pix' | 'dinheiro' | 'debito' | 'credito';

export type Sale = {
  id: string;
  valor_total: number | string;
  vendido_em: string;
  vendedor?: string | null;
  cliente_nome?: string | null;
  forma_pagamento?: PaymentMethod | null;
  itens?: Array<{ id: string; produto_nome: string; quantidade: number; preco_unitario: number | string; subtotal: number | string }>;
};

export type OperatorSummary = { name: string; count: number; total: number };

export const paymentLabels: Record<PaymentMethod, string> = { pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito' };
export const money = (value: unknown) => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const dateTime = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
export const panelSx = { border: '1px solid var(--line)', borderRadius: '14px', bgcolor: 'var(--card)', color: 'var(--ink)', boxShadow: '0 4px 16px #0f172a08' };

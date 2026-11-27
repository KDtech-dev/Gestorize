'use client';

import { Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { Icon } from '@iconify/react';
import type { Sale } from './types';
import { dateTime, money, panelSx, paymentLabels } from './types';

type Props = { sale: Sale | null; canReturn: boolean; returning: boolean; onPrint: (sale: Sale) => void; onReturn: (sale: Sale) => void };

export function SaleDetails({ sale, canReturn, returning, onPrint, onReturn }: Props) {
  return <Paper component="section" className="sales-details-panel" sx={{ ...panelSx, p: 1.9 }}>
    {sale ? <>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}><div><Typography component="h2" sx={{ fontSize: 15, fontWeight: 800 }}>Venda #{sale.id.slice(0, 8).toUpperCase()}</Typography><Typography className="sales-detail-meta" sx={{ mt: 0.25, color: 'var(--muted)', fontSize: 10 }}>{sale.vendedor || 'Operador não informado'} · {sale.forma_pagamento ? paymentLabels[sale.forma_pagamento] : 'Pagamento não informado'} · {dateTime(sale.vendido_em)}</Typography></div><Chip size="small" label={sale.status === 'estornada' ? 'Estornada' : 'Concluída'} color={sale.status === 'estornada' ? 'error' : 'primary'} sx={{ height: 21, fontSize: 10, fontWeight: 700 }} /></Stack>
      {sale.cliente_nome && <Typography className="sales-detail-customer" sx={{ mt: 1.4, color: 'var(--muted)', fontSize: 11 }}>Cliente: {sale.cliente_nome}</Typography>}
      <Stack spacing={0.9} sx={{ mt: 1.4, maxHeight: 250, overflowY: 'auto' }}>{sale.itens?.map((item) => <Stack key={item.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}><Typography className="sales-detail-item" sx={{ minWidth: 0, color: 'var(--muted)', fontSize: 11 }}>{item.quantidade} × {item.produto_nome}</Typography><Typography className="sales-detail-item-price" sx={{ flexShrink: 0, fontSize: 11, fontWeight: 600 }}>{money(item.subtotal)}</Typography></Stack>)}</Stack>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mt: 1.5, pt: 1.25, borderTop: '1px solid var(--line)' }}><Typography className="sales-detail-total-label" sx={{ fontSize: 13, fontWeight: 800 }}>Total</Typography><Typography className="sales-detail-total-value" sx={{ color: 'var(--primary)', font: '800 24px Manrope,sans-serif' }}>{money(sale.valor_total)}</Typography></Stack>
      {sale.status === 'estornada' && sale.estornada_em && <Typography sx={{ mt: 0.75, color: 'var(--muted)', fontSize: 11 }}>Estornada em {dateTime(sale.estornada_em)}{sale.estornada_por ? ` por ${sale.estornada_por}` : ''}{sale.estornada_autorizada_por ? ` · autorizada por ${sale.estornada_autorizada_por}` : ''}</Typography>}
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 0.75, mt: 1.5 }}><Button size="small" variant="outlined" onClick={() => onPrint(sale)} startIcon={<Icon icon="mdi:printer-outline" />} sx={{ textTransform: 'none' }}>Imprimir comprovante</Button>{canReturn && sale.status !== 'estornada' && <Button size="small" color="error" variant="outlined" disabled={returning} onClick={() => onReturn(sale)} startIcon={<Icon icon="mdi:backup-restore" />} sx={{ textTransform: 'none' }}>{returning ? 'Estornando…' : 'Retornar venda'}</Button>}</Stack>
    </> : <><Typography component="h2" sx={{ fontSize: 15, fontWeight: 800 }}>Detalhes da venda</Typography><Typography sx={{ mt: 1, color: 'var(--muted)', fontSize: 12 }}>Selecione uma venda no histórico para ver os itens.</Typography></>}
  </Paper>;
}

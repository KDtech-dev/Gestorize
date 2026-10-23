'use client';

import { Chip, Paper, Stack, Typography } from '@mui/material';
import type { Sale } from './types';
import { dateTime, money, panelSx, paymentLabels } from './types';

export function SaleDetails({ sale }: { sale: Sale | null }) {
  return <Paper component="section" sx={{ ...panelSx, p: 1.9 }}>
    {sale ? <>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}><div><Typography component="h2" sx={{ fontSize: 15, fontWeight: 800 }}>Venda #{sale.id.slice(0, 8).toUpperCase()}</Typography><Typography sx={{ mt: 0.25, color: 'var(--muted)', fontSize: 10 }}>{sale.vendedor || 'Operador não informado'} · {sale.forma_pagamento ? paymentLabels[sale.forma_pagamento] : 'Pagamento não informado'} · {dateTime(sale.vendido_em)}</Typography></div><Chip size="small" label="Concluída" sx={{ height: 21, bgcolor: 'color-mix(in srgb, #2563eb 11%, var(--card))', color: '#1d4ed8', fontSize: 10, fontWeight: 700 }} /></Stack>
      {sale.cliente_nome && <Typography sx={{ mt: 1.4, color: 'var(--muted)', fontSize: 11 }}>Cliente: {sale.cliente_nome}</Typography>}
      <Stack spacing={0.9} sx={{ mt: 1.4, maxHeight: 250, overflowY: 'auto' }}>{sale.itens?.map((item) => <Stack key={item.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}><Typography sx={{ minWidth: 0, color: 'var(--muted)', fontSize: 11 }}>{item.quantidade} × {item.produto_nome}</Typography><Typography sx={{ flexShrink: 0, fontSize: 11, fontWeight: 600 }}>{money(item.subtotal)}</Typography></Stack>)}</Stack>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mt: 1.5, pt: 1.25, borderTop: '1px solid var(--line)' }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>Total</Typography><Typography sx={{ color: 'var(--primary)', font: '800 24px Manrope,sans-serif' }}>{money(sale.valor_total)}</Typography></Stack>
    </> : <><Typography component="h2" sx={{ fontSize: 15, fontWeight: 800 }}>Detalhes da venda</Typography><Typography sx={{ mt: 1, color: 'var(--muted)', fontSize: 12 }}>Selecione uma venda no histórico para ver os itens.</Typography></>}
  </Paper>;
}

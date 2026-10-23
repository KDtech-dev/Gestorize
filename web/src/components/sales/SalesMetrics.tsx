'use client';

import { Icon } from '@iconify/react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { money, panelSx } from './types';

type Props = { count: number; revenue: number; average: number; operators: number; ready: boolean };

export function SalesMetrics({ count, revenue, average, operators, ready }: Props) {
  const metrics = [
    { label: 'Vendas hoje', value: String(count), caption: 'Vendas concluídas hoje', icon: 'mdi:receipt-text-outline' },
    { label: 'Faturamento', value: money(revenue), caption: 'Soma das vendas de hoje', icon: 'mdi:cash-multiple' },
    { label: 'Ticket médio', value: money(average), caption: 'Valor médio por venda hoje', icon: 'mdi:chart-line' },
    { label: 'Operadores', value: String(operators), caption: 'Com vendas registradas hoje', icon: 'mdi:account-tie-outline' },
  ];

  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', lg: 'repeat(4,minmax(0,1fr))' }, gap: 1.5 }}>
    {metrics.map((metric) => <Paper key={metric.label} component="article" sx={{ ...panelSx, minWidth: 0, p: { xs: 1.5, md: 1.9 } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ color: 'var(--muted)', fontSize: 12, fontWeight: 600 }}>{metric.label}</Typography>
        <Box sx={{ width: 32, height: 32, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '10px', bgcolor: 'color-mix(in srgb, var(--primary) 9%, var(--card))', color: 'var(--primary)' }}><Icon icon={metric.icon} width={19} height={19} /></Box>
      </Stack>
      <Typography sx={{ mt: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--ink)', font: '800 clamp(19px,2vw,25px) Manrope,sans-serif', whiteSpace: 'nowrap' }}>{ready ? metric.value : '—'}</Typography>
      <Typography sx={{ mt: 0.35, color: 'var(--muted)', fontSize: 11 }}>{metric.caption}</Typography>
    </Paper>)}
  </Box>;
}

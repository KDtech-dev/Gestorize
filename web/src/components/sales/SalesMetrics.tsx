'use client';

import { Icon } from '@iconify/react';
import { Box, Paper, Typography } from '@mui/material';
import type { CSSProperties } from 'react';
import { money } from './types';

type Props = { count: number; revenue: number; average: number; operators: number; ready: boolean };

export function SalesMetrics({ count, revenue, average, operators, ready }: Props) {
  const metrics = [
    { label: 'Vendas hoje', value: String(count), caption: 'Vendas concluídas hoje', icon: 'mdi:receipt-text-outline', color: '#005CE4' },
    { label: 'Faturamento', value: money(revenue), caption: 'Soma das vendas de hoje', icon: 'mdi:cash-multiple', color: '#0f9f73' },
    { label: 'Ticket médio', value: money(average), caption: 'Valor médio por venda hoje', icon: 'mdi:chart-line', color: '#e78a12' },
    { label: 'Operadores', value: String(operators), caption: 'Com vendas registradas hoje', icon: 'mdi:account-tie-outline', color: '#8b5cf6' },
  ];

  return <Box component="section" className="client-summary-grid sales-metrics-grid" aria-label="Resumo das vendas de hoje">
    {metrics.map((metric) => <Paper component="article" elevation={0} className="client-summary-card sales-metric-card" key={metric.label} style={{ '--summary-color': metric.color } as CSSProperties} sx={{ bgcolor: 'var(--card)', color: 'var(--ink)' }}>
      <Box component="span" className="client-summary-icon"><Icon icon={metric.icon} width={22} height={22} /></Box>
      <Typography component="span" className="client-summary-label">{metric.label}</Typography>
      <Typography component="strong">{ready ? metric.value : '—'}</Typography>
      <Typography component="small">{metric.caption}</Typography>
    </Paper>)}
  </Box>;
}

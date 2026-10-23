'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Box, Card, CardContent, Link as MuiLink, Paper, Stack, Typography } from '@mui/material';

export type SummaryKey = 'clientes' | 'orcamentos_aprovados' | 'orcamentos_pendentes' | 'produtos_em_estoque';
export type Metric = { key: SummaryKey; label: string; icon: string; permission: string; href: string };
export type QuickItem = { href: string; title: string; description: string; icon: string; permission: string };

export function MetricCard({ metric, value, loading }: { metric: Metric; value: number | null | undefined; loading: boolean }) {
  return (
    <Card component="article" sx={{ position: 'relative', minHeight: 151, overflow: 'hidden', border: '1px solid var(--line)', borderRadius: '16px', bgcolor: 'var(--card)', boxShadow: '0 6px 20px #1d392a08', '&::before': { content: '""', position: 'absolute', inset: '0 auto 0 0', width: 3, bgcolor: '#005CE4' } }}>
      <CardContent sx={{ height: '100%', p: '18px 19px !important', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>{metric.label}</Typography>
          <Box sx={{ width: 36, height: 36, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '11px', bgcolor: '#005CE41a', color: '#005CE4' }}>
            <Icon icon={metric.icon} width={21} height={21} />
          </Box>
        </Stack>
        <Typography component="strong" sx={{ color: 'var(--ink)', font: '800 30px Manrope,sans-serif', letterSpacing: '-1px' }}>
          {loading ? '—' : (value ?? 0).toLocaleString('pt-BR')}
        </Typography>
        <MuiLink component={Link} href={metric.href} underline="none" sx={{ width: 'max-content', color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>
          Abrir {metric.href === '/orcamentos' ? 'orçamentos' : metric.href.slice(1)} <Box component="span" sx={{ pl: 0.5 }}>↗</Box>
        </MuiLink>
      </CardContent>
    </Card>
  );
}

export function QuickAccessCard({ item }: { item: QuickItem }) {
  return (
    <Paper
      component={Link}
      href={item.href}
      sx={{ minHeight: 78, p: 1.75, display: 'flex', alignItems: 'center', gap: 1.5, border: '1px solid var(--line)', borderRadius: '14px', bgcolor: 'var(--card)', color: 'var(--ink)', textDecoration: 'none', transition: 'border-color .16s, box-shadow .16s, transform .16s', '&:hover': { borderColor: '#bfdbfe', boxShadow: 'var(--shadow)', transform: 'translateY(-1px)' } }}
    >
      <Box sx={{ width: 40, height: 40, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '12px', bgcolor: '#005CE41a', color: '#005CE4' }}><Icon icon={item.icon} width={22} height={22} /></Box>
      <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <Typography component="strong" sx={{ fontSize: 14, fontWeight: 700 }}>{item.title}</Typography>
        <Typography component="small" sx={{ overflow: 'hidden', color: 'var(--muted)', fontSize: 12, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</Typography>
      </Box>
      <Typography component="span" sx={{ ml: 'auto', color: 'var(--muted)', fontSize: 18 }}>↗</Typography>
    </Paper>
  );
}

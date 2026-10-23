'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Box, Card, CardContent, Link as MuiLink, Paper, Stack, Typography } from '@mui/material';

export type SummaryKey = 'clientes' | 'orcamentos_aprovados' | 'orcamentos_pendentes' | 'produtos_em_estoque';
export type Metric = { key: SummaryKey; label: string; icon: string; permission: string; href: string; color: string };
export type QuickItem = { href: string; title: string; description: string; icon: string; permission: string; viewPermission: string };

export function MetricCard({ metric, value, loading }: { metric: Metric; value: number | null | undefined; loading: boolean }) {
  return (
    <Card component="article" sx={{ minHeight: { xs: 142, md: 154 }, border: '1px solid var(--line)', borderRadius: '17px', bgcolor: 'var(--card)', boxShadow: '0 8px 24px #0f172a0a' }}>
      <CardContent sx={{ minHeight: { xs: 142, md: 154 }, p: { xs: '14px !important', md: '17px !important' }, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.1 }}>
          <Box sx={{ width: 39, height: 39, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '12px', bgcolor: `${metric.color}20`, color: metric.color }}>
            <Icon icon={metric.icon} width={22} height={22} />
          </Box>
          <Typography sx={{ color: 'var(--muted)', fontSize: 'clamp(15px,1.15vw,17px)', fontWeight: 700, lineHeight: 1.35 }}>{metric.label}</Typography>
        </Stack>
        <Typography component="strong" sx={{ mt: 1.5, color: 'var(--ink)', font: '800 clamp(28px,2.25vw,36px) Manrope,sans-serif', letterSpacing: '-1px', lineHeight: 1.1 }}>
          {loading ? '—' : (value ?? 0).toLocaleString('pt-BR')}
        </Typography>
        <MuiLink component={Link} href={metric.href} underline="none" sx={{ mt: 0.75, width: 'max-content', color: metric.color, fontSize: 'clamp(14px,1vw,16px)', fontWeight: 800 }}>
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
        <Typography component="strong" sx={{ fontSize: 'clamp(16px,1.15vw,18px)', fontWeight: 700 }}>{item.title}</Typography>
        <Typography component="small" sx={{ overflow: 'hidden', color: 'var(--muted)', fontSize: 'clamp(14px,1vw,16px)', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</Typography>
      </Box>
      <Typography component="span" sx={{ ml: 'auto', color: 'var(--muted)', fontSize: 18 }}>↗</Typography>
    </Paper>
  );
}

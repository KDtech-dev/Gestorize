'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Box, CircularProgress, Link as MuiLink, Paper, Stack, Typography } from '@mui/material';
import { MetricCard, QuickAccessCard, type Metric, type QuickItem, type SummaryKey } from '@/components/DashboardCards';

type Report = { totais: Record<string, number>; serie: { rotulos: string[]; valores: number[] } };

export function MetricsGrid({ metrics, values, loading }: { metrics: Metric[]; values: Partial<Record<SummaryKey, number | null>> | null; loading: boolean }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', lg: 'repeat(4,minmax(0,1fr))' }, gap: 1.75 }}>
      {metrics.map((metric) => (
        <MetricCard key={metric.key} metric={metric} value={values?.[metric.key]} loading={loading} />
      ))}
    </Box>
  );
}

function PanelTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
      <Box>
        <Typography component="span" sx={{ color: 'var(--muted)', fontSize: 10, fontWeight: 800, letterSpacing: 1.1 }}>{eyebrow}</Typography>
        <Typography component="h2" sx={{ mt: 0.5, color: 'var(--ink)', font: '800 18px Manrope,sans-serif' }}>{title}</Typography>
        <Typography sx={{ mt: 0.75, color: 'var(--muted)', fontSize: { xs: 14, md: 15 }, lineHeight: 1.5 }}>{description}</Typography>
      </Box>
      {action}
    </Stack>
  );
}

const panelSx = { minWidth: 0, minHeight: { xs: 350, md: 380 }, p: { xs: 1.9, md: 2.5 }, border: '1px solid var(--line)', borderRadius: '17px', bgcolor: 'var(--card)', boxShadow: '0 8px 30px #1d392a06' };

export function ReportPanels({ report, loading }: { report: Report | null; loading: boolean }) {
  const maxValue = Math.max(...(report?.serie.valores ?? []), 1);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.65fr) minmax(260px,.8fr)' }, gap: 1.9 }}>
      <Paper component="article" sx={panelSx}>
        <PanelTitle
          eyebrow="ÚLTIMOS 7 DIAS"
          title="Orçamentos criados"
          description="Quantidade registrada em cada dia."
          action={<MuiLink component={Link} href="/relatorios" underline="none" sx={{ flexShrink: 0, mt: 0.5, color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>Ver relatórios ↗</MuiLink>}
        />
        {loading ? (
          <Stack direction="row" sx={{ minHeight: 280, alignItems: 'center', justifyContent: 'center', gap: 1, color: 'var(--muted)', fontSize: 13 }}><CircularProgress size={18} />Carregando atividade…</Stack>
        ) : report?.serie.rotulos.length ? (
          <Box sx={{ height: 280, display: 'grid', gridTemplateColumns: `repeat(${report.serie.rotulos.length},minmax(0,1fr))`, alignItems: 'end', gap: { xs: 0.75, md: 1.5 }, mt: 2.5 }}>
            {report.serie.rotulos.map((label, index) => {
              const value = Number(report.serie.valores[index] ?? 0);
              return (
                <Stack key={`${label}-${index}`} sx={{ height: '100%', minWidth: 0, alignItems: 'center', justifyContent: 'flex-end', gap: 0.9 }}>
                  <Typography sx={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700 }}>{value}</Typography>
                  <Box sx={{ width: 'min(100%,36px)', height: 210, display: 'flex', alignItems: 'flex-end', overflow: 'hidden', borderRadius: '8px', bgcolor: 'var(--surface-soft)' }}>
                    <Box sx={{ width: '100%', minHeight: 3, height: `${Math.max(value ? 8 : 3, value / maxValue * 100)}%`, borderRadius: '7px 7px 3px 3px', bgcolor: '#005CE4' }} />
                  </Box>
                  <Typography component="span" sx={{ color: 'var(--muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{label}</Typography>
                </Stack>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ minHeight: 170, display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 13 }}>Ainda não há orçamentos neste período.</Box>
        )}
      </Paper>

      <Paper component="article" sx={panelSx}>
        <PanelTitle eyebrow="MOVIMENTAÇÃO RECENTE" title="Atividade de orçamentos" description="Eventos registrados durante esta semana." />
        {loading ? <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 13 }}>Atualizando…</Box> : <>
          <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1.2, my: 3 }}>
            <Typography component="strong" sx={{ color: 'var(--ink)', font: '800 38px Manrope,sans-serif', letterSpacing: '-1px' }}>{Number(report?.totais.orcamentos ?? 0).toLocaleString('pt-BR')}</Typography>
            <Typography sx={{ color: 'var(--muted)', fontSize: 13 }}>criados na semana</Typography>
          </Stack>
          {[
            { label: 'Aprovações registradas', value: report?.totais.aprovacoes ?? 0, color: '#16a34a', icon: 'mdi:check-circle' },
            { label: 'Pendentes criados', value: report?.totais.pendentes ?? 0, color: '#f59e0b', icon: 'mdi:clock-outline' },
          ].map((row) => (
            <Stack key={row.label} direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', py: 1.6, borderTop: '1px solid var(--line)', color: 'var(--muted)' }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1, fontSize: 13 }}><Icon icon={row.icon} width={17} height={17} color={row.color} />{row.label}</Stack>
              <Typography component="strong" sx={{ color: 'var(--ink)', fontSize: 15, fontWeight: 700 }}>{Number(row.value).toLocaleString('pt-BR')}</Typography>
            </Stack>
          ))}
        </>}
      </Paper>
    </Box>
  );
}

const quickItems: QuickItem[] = [
  { href: '/produtos?novo=1', title: 'Novo produto', description: 'Adicionar item ao catálogo', icon: 'mdi:package-variant-plus', permission: 'produtos.criar', viewPermission: 'produtos.ver' },
  { href: '/orcamentos?novo=1', title: 'Novo orçamento', description: 'Criar proposta para cliente', icon: 'mdi:file-document-plus-outline', permission: 'orcamentos.criar', viewPermission: 'orcamentos.ver' },
  { href: '/clientes?novo=1', title: 'Novo cliente', description: 'Cadastrar cliente', icon: 'mdi:account-plus-outline', permission: 'clientes.criar', viewPermission: 'clientes.ver' },
  { href: '/fornecedores?novo=1', title: 'Novo fornecedor', description: 'Cadastrar parceiro comercial', icon: 'mdi:truck-plus-outline', permission: 'fornecedores.criar', viewPermission: 'fornecedores.ver' },
  { href: '/funcionarios?novo=1', title: 'Novo funcionário', description: 'Adicionar pessoa à equipe', icon: 'mdi:account-cog-outline', permission: 'users.criar', viewPermission: 'users.ver' },
];

export function QuickAccess({ can }: { can: (permission: string) => boolean }) {
  const items = quickItems.filter((item) => can(item.permission) && can(item.viewPermission));

  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack sx={{ mb: 1.5 }}>
        <Typography component="span" sx={{ color: 'var(--muted)', fontSize: 10, fontWeight: 800, letterSpacing: 1.1 }}>ATALHOS</Typography>
        <Typography component="h2" sx={{ mt: 0.5, color: 'var(--ink)', font: '800 21px Manrope,sans-serif' }}>Ações rápidas</Typography>
        <Typography sx={{ mt: 0.5, color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>Crie cadastros e inicie operações.</Typography>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.1 }}>
        {items.map((item) => (
          <QuickAccessCard key={item.href} item={item} />
        ))}
      </Box>
    </Box>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, unwrap } from '@/lib/api';
import { MetricsGrid, QuickAccess, ReportPanels } from '@/components/DashboardWidgets';

type Summary = { clientes: number | null; orcamentos_aprovados: number | null; orcamentos_pendentes: number | null; produtos_em_estoque: number | null };
type Report = { totais: Record<string, number>; serie: { rotulos: string[]; valores: number[] } };

const cards = [
  { key: 'clientes', label: 'Clientes cadastrados', icon: 'mdi:account-multiple-outline', permission: 'clientes.ver', href: '/clientes' },
  { key: 'orcamentos_aprovados', label: 'Orçamentos aprovados', icon: 'mdi:check-circle-outline', permission: 'orcamentos.ver', href: '/orcamentos' },
  { key: 'orcamentos_pendentes', label: 'Orçamentos pendentes', icon: 'mdi:clock-outline', permission: 'orcamentos.ver', href: '/orcamentos' },
  { key: 'produtos_em_estoque', label: 'Produtos em estoque', icon: 'mdi:package-variant-closed', permission: 'produtos.ver', href: '/produtos' },
] as const;

export function Dashboard() {
  const { can } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(true);

  useEffect(() => {
    apiFetch<unknown>('/dashboard/resumo')
      .then((response) => setSummary(unwrap<Summary>(response as never)))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o resumo.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!can('relatorios.ver')) { setReportLoading(false); return; }
    apiFetch<unknown>('/relatorios?periodo=semana&tipo=orcamentos')
      .then((response) => setReport(unwrap<Report>(response as never)))
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  }, [can]);

  const visibleCards = cards.filter((card) => can(card.permission));

  return (
    <Stack spacing={3}>
      <Box sx={{ pb: 0.5, display: 'flex', alignItems: { xs: 'flex-start', sm: 'flex-end' }, justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography component="span" sx={{ color: 'var(--muted)', fontSize: 11, fontWeight: 800, letterSpacing: 1.1 }}>PAINEL DE CONTROLE</Typography>
          <Typography component="h1" sx={{ mt: 0.5, color: 'var(--ink)', font: '800 clamp(25px,3vw,32px) Manrope,sans-serif', letterSpacing: '-0.7px' }}>Visão geral</Typography>
          <Typography sx={{ mt: 0.75, color: 'var(--muted)', fontSize: { xs: 14, md: 15 }, lineHeight: 1.5 }}>Acompanhe os indicadores e acesse as principais ações do sistema.</Typography>
        </Box>
        {can('vendas.ver') && can('vendas.criar') && (
          <Button
            component={Link}
            href="/vendas/nova"
            variant="contained"
            startIcon={<Icon icon="mdi:cart-outline" width={23} height={23} />}
            sx={{ minHeight: 52, px: 3, mb: 0.75, borderRadius: '12px', bgcolor: '#005CE4', color: '#fff', fontSize: 16, fontWeight: 700, textTransform: 'none', boxShadow: '0 5px 14px #005CE433', '&:hover': { bgcolor: '#0048b8', boxShadow: '0 7px 18px #005CE440' } }}
          >
            Vender +
          </Button>
        )}
      </Box>
      {error && <Alert severity="error" variant="outlined" sx={{ borderRadius: '12px' }}>{error}</Alert>}
      <MetricsGrid metrics={[...visibleCards]} values={summary} loading={loading} />
      {can('relatorios.ver') ? (
        <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,2.2fr) minmax(280px,.8fr)' }, alignItems: 'start', gap: { xs: 3, lg: 2.5 } }}>
          <ReportPanels report={report} loading={reportLoading} />
          <QuickAccess can={can} />
        </Box>
      ) : <QuickAccess can={can} />}
    </Stack>
  );
}

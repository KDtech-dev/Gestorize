'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, unwrap } from '@/lib/api';
import { WelcomeBanner } from '@/components/WelcomeBanner';
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
      <WelcomeBanner />
      <Box>
        <Typography component="span" sx={{ color: 'var(--muted)', fontSize: 10, fontWeight: 800, letterSpacing: 1.1 }}>ACOMPANHAMENTO</Typography>
        <Typography component="h2" sx={{ mt: 0.5, color: 'var(--ink)', font: '800 21px Manrope,sans-serif' }}>Resumo do sistema</Typography>
      </Box>
      {error && <Alert severity="error" variant="outlined" sx={{ borderRadius: '12px' }}>{error}</Alert>}
      <MetricsGrid metrics={[...visibleCards]} values={summary} loading={loading} />
      {can('relatorios.ver') && <ReportPanels report={report} loading={reportLoading} />}
      <QuickAccess can={can} />
    </Stack>
  );
}

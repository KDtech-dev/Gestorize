'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { canSell, useAuth } from '@/context/AuthContext';
import { apiFetch, unwrap } from '@/lib/api';
import { MetricsGrid, QuickAccess, ReportPanels } from '@/components/DashboardWidgets';
import { OrganizationsAdmin } from '@/components/OrganizationsAdmin';

type Summary = { clientes: number | null; orcamentos_aprovados: number | null; orcamentos_pendentes: number | null; produtos_em_estoque: number | null };
type Report = { totais: Record<string, number>; serie: { rotulos: string[]; valores: number[] } };
type ActivityType = 'orcamentos' | 'vendas';
const activityStorageKey = (userId: string) => `gestorize:dashboard:activity:${userId}`;

const cards = [
  { key: 'clientes', label: 'Clientes cadastrados', icon: 'mdi:account-multiple-outline', permission: 'clientes.ver', href: '/clientes', color: '#9333EA' },
  { key: 'orcamentos_aprovados', label: 'Orçamentos aprovados', icon: 'mdi:check-circle-outline', permission: 'orcamentos.ver', href: '/orcamentos', color: '#00A83B' },
  { key: 'orcamentos_pendentes', label: 'Orçamentos pendentes', icon: 'mdi:clock-outline', permission: 'orcamentos.ver', href: '/orcamentos', color: '#F97316' },
  { key: 'produtos_em_estoque', label: 'Produtos em estoque', icon: 'mdi:package-variant-closed', permission: 'produtos.ver', href: '/produtos', color: '#0EA5E9' },
] as const;

export function Dashboard() {
  const { can, user } = useAuth();
  const isGlobalAdmin = user?.role === 'admin' && !user.organization_id;
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [chartReport, setChartReport] = useState<Report | null>(null);
  const [budgetReport, setBudgetReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [activityType, setActivityType] = useState<ActivityType>('orcamentos');
  const [activityPreferenceReady, setActivityPreferenceReady] = useState(false);

  useEffect(() => {
    if (isGlobalAdmin) { setLoading(false); return; }
    apiFetch<unknown>('/dashboard/resumo')
      .then((response) => setSummary(unwrap<Summary>(response as never)))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o resumo.'))
      .finally(() => setLoading(false));
  }, [isGlobalAdmin]);

  useEffect(() => {
    if (!user?.id) return;
    const saved = window.localStorage.getItem(activityStorageKey(user.id));
    if (saved === 'vendas' || saved === 'orcamentos') setActivityType(saved);
    setActivityPreferenceReady(true);
  }, [user?.id]);

  useEffect(() => {
    if (isGlobalAdmin || !can('relatorios.ver')) { setReportLoading(false); return; }
    if (!activityPreferenceReady) return;

    setReportLoading(true);
    const chartRequest = apiFetch<unknown>(`/relatorios?periodo=semana&tipo=${activityType}`)
      .then((response) => unwrap<Report>(response as never));
    const budgetRequest = activityType === 'orcamentos'
      ? chartRequest
      : apiFetch<unknown>('/relatorios?periodo=semana&tipo=orcamentos').then((response) => unwrap<Report>(response as never));

    Promise.all([chartRequest, budgetRequest])
      .then(([chart, budget]) => { setChartReport(chart); setBudgetReport(budget); })
      .catch(() => { setChartReport(null); setBudgetReport(null); })
      .finally(() => setReportLoading(false));
  }, [activityType, activityPreferenceReady, can, isGlobalAdmin]);

  const changeActivityType = (type: ActivityType) => {
    setActivityType(type);
    if (user?.id) window.localStorage.setItem(activityStorageKey(user.id), type);
  };

  const visibleCards = cards.filter((card) => can(card.permission));

  if (isGlobalAdmin) return <OrganizationsAdmin />;

  return (
    <Stack spacing={3}>
      <Box sx={{ pb: 0.5, display: 'flex', alignItems: { xs: 'flex-start', sm: 'flex-end' }, justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography component="span" sx={{ color: 'var(--muted)', fontSize: 'clamp(12px,1vw,14px)', fontWeight: 800, letterSpacing: 1.1 }}>PAINEL DE CONTROLE</Typography>
          <Typography component="h1" sx={{ mt: 0.5, color: 'var(--ink)', font: '800 clamp(30px,3.4vw,40px) Manrope,sans-serif', letterSpacing: '-0.7px' }}>Visão geral</Typography>
          <Typography sx={{ mt: 0.75, color: 'var(--muted)', fontSize: 'clamp(16px,1.2vw,18px)', lineHeight: 1.5 }}>Acompanhe os indicadores e acesse as principais ações do sistema.</Typography>
        </Box>
        {canSell(user) && (
          <Button
            component={Link}
            href="/vendas/nova"
            variant="contained"
            startIcon={<Icon icon="mdi:cart-outline" width={23} height={23} />}
            sx={{ minHeight: 54, px: 3, mb: 0.75, borderRadius: '12px', bgcolor: '#005CE4', color: '#fff', fontSize: 'clamp(16px,1.15vw,18px)', fontWeight: 700, textTransform: 'none', boxShadow: '0 5px 14px #005CE433', '&:hover': { bgcolor: '#0048b8', boxShadow: '0 7px 18px #005CE440' } }}
          >
            Vender +
          </Button>
        )}
      </Box>
      {error && <Alert severity="error" variant="outlined" sx={{ borderRadius: '12px' }}>{error}</Alert>}
      <MetricsGrid metrics={[...visibleCards]} values={summary} loading={loading} />
      {can('relatorios.ver') ? (
        <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,2.2fr) minmax(280px,.8fr)' }, alignItems: 'start', gap: { xs: 3, lg: 2.5 } }}>
          <ReportPanels report={chartReport} budgetReport={budgetReport} loading={reportLoading} activityType={activityType} onActivityTypeChange={changeActivityType} />
          <QuickAccess can={can} />
        </Box>
      ) : <QuickAccess can={can} />}
    </Stack>
  );
}

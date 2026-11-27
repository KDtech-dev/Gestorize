'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { apiFetch, unwrap } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { OperatorSummary, PaymentMethod, Sale } from '@/components/sales/types';
import { SalesMetrics } from '@/components/sales/SalesMetrics';
import { SalesHistory } from '@/components/sales/SalesHistory';
import { SalesOperators } from '@/components/sales/SalesOperators';
import { SaleDetails } from '@/components/sales/SaleDetails';
import { useToast } from '@/context/ToastContext';
import { printSaleReceipt } from '@/lib/salesReceipt';

function unwrapList<T>(payload: unknown): T[] {
  const value = unwrap<unknown>(payload as never);
  return Array.isArray(value) ? value as T[] : [];
}

function isToday(value: string, today: Date) {
  const date = new Date(value);
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export function SalesOverview() {
  const router = useRouter();
  const { can, user } = useAuth();
  const { showToast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState<'todas' | PaymentMethod>('todas');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [today, setToday] = useState<Date | null>(null);
  const [returningId, setReturningId] = useState('');
  const [returnTarget, setReturnTarget] = useState<Sale | null>(null);
  const [returnBadgeCode, setReturnBadgeCode] = useState('');
  const [returnPassword, setReturnPassword] = useState('');

  useEffect(() => {
    setToday(new Date());
    apiFetch<unknown>('/vendas')
      .then((response) => {
        const records = unwrapList<Sale>(response).sort((a, b) => new Date(b.vendido_em).getTime() - new Date(a.vendido_em).getTime());
        setSales(records);
        setSelectedId(records[0]?.id ?? '');
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o histórico de vendas.'))
      .finally(() => setLoading(false));
  }, []);

  const completedSales = useMemo(() => sales.filter((sale) => sale.status !== 'estornada'), [sales]);
  const todaysSales = useMemo(() => today ? completedSales.filter((sale) => isToday(sale.vendido_em, today)) : [], [completedSales, today]);
  const revenue = todaysSales.reduce((sum, sale) => sum + Number(sale.valor_total), 0);
  const average = todaysSales.length ? revenue / todaysSales.length : 0;
  const operators = useMemo<OperatorSummary[]>(() => {
    const grouped = new Map<string, OperatorSummary>();
    for (const sale of todaysSales) {
      const name = sale.vendedor?.trim() || 'Operador não informado';
      const current = grouped.get(name) ?? { name, count: 0, total: 0 };
      current.count += 1;
      current.total += Number(sale.valor_total);
      grouped.set(name, current);
    }
    return [...grouped.values()].sort((a, b) => b.total - a.total);
  }, [todaysSales]);
  const visibleSales = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return sales.filter((sale) => {
      const matchesPayment = filter === 'todas' || sale.forma_pagamento === filter;
      const matchesSearch = !term || [sale.id, sale.vendedor, sale.cliente_nome].some((value) => String(value ?? '').toLocaleLowerCase('pt-BR').includes(term));
      return matchesPayment && matchesSearch;
    });
  }, [sales, filter, search]);
  const selected = sales.find((sale) => sale.id === selectedId) ?? visibleSales[0] ?? null;

  const organizationLogo = user?.organization?.settings?.logo_url ?? user?.organization?.settings?.logo;
  const logoUrl = typeof organizationLogo === 'string' ? organizationLogo : null;

  const printReceipt = (sale: Sale) => {
    if (!printSaleReceipt(sale, user?.organization?.name ?? user?.organization_name ?? 'Loja', logoUrl)) {
      showToast('Permita pop-ups para imprimir o comprovante.', 'error');
    }
  };

  const returnSale = async () => {
    const sale = returnTarget;
    if (!sale || returningId || !returnBadgeCode.trim() || !returnPassword) return;
    setReturningId(sale.id);
    try {
      await apiFetch(`/vendas/${encodeURIComponent(sale.id)}/estornar`, {
        method: 'POST',
        body: JSON.stringify({ codigo_autorizador: returnBadgeCode.trim(), senha_autorizador: returnPassword }),
      });
      showToast('Venda estornada. Abrindo o caixa com os produtos no carrinho.', 'success');
      setReturnTarget(null);
      setReturnBadgeCode('');
      setReturnPassword('');
      router.push(`/vendas/nova?retomar=${encodeURIComponent(sale.id)}`);
    } catch (reason) {
      setReturnBadgeCode('');
      setReturnPassword('');
      showToast(reason instanceof Error ? reason.message : 'Não foi possível estornar a venda.', 'error');
    } finally {
      setReturningId('');
    }
  };

  return <div className="clients-page sales-overview-page">
    <header className="clients-page-heading">
      <div className="clients-heading-content"><span className="eyebrow"><Icon icon="mdi:cash-register" width={19} height={19} /><span>COMERCIAL</span></span><h1>Vendas</h1><p>Acompanhe o desempenho diário, consulte o histórico e os detalhes das vendas.</p></div>
      <div className="clients-heading-actions">{can('vendas.criar') && <Button component={Link} href="/vendas/nova" variant="contained" startIcon={<Icon icon="mdi:plus" width={20} height={20} />} sx={{ minHeight: 46, px: 2, borderRadius: '10px', bgcolor: '#005ce4', fontWeight: 750, textTransform: 'none', '&:hover': { bgcolor: '#0048b8' } }}>Nova venda</Button>}</div>
    </header>

    <SalesMetrics count={todaysSales.length} revenue={revenue} average={average} operators={operators.length} ready={Boolean(today)} />
    {error && <div className="inline-error sales-inline-error">{error}</div>}

    <Box className="sales-overview-grid" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0,2.1fr) minmax(290px,.9fr)' }, gap: 1.75, alignItems: 'start' }}>
      <SalesHistory sales={visibleSales} selectedId={selected?.id ?? ''} filter={filter} search={search} loading={loading} onSelect={setSelectedId} onFilter={setFilter} onSearch={setSearch} />
      <Stack spacing={1.75}>
        <SalesOperators operators={operators} loading={loading} />
        <SaleDetails sale={selected} canReturn={can('vendas.criar')} returning={returningId === selected?.id} onPrint={printReceipt} onReturn={setReturnTarget} />
      </Stack>
    </Box>
    <Dialog open={Boolean(returnTarget)} onClose={() => { if (!returningId) { setReturnTarget(null); setReturnBadgeCode(''); setReturnPassword(''); } }} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Autorização do gestor</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'var(--muted)', fontSize: 13, mb: 2 }}>A venda #{returnTarget?.id.slice(0, 8).toUpperCase()} será estornada e os itens voltarão ao estoque. Peça ao gestor para escanear o crachá e confirmar com a senha da própria conta.</Typography>
        <Stack spacing={1.5}>
          <TextField autoFocus fullWidth label="Código do crachá do gestor" value={returnBadgeCode} onChange={(event) => setReturnBadgeCode(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); setReturnBadgeCode(event.currentTarget.value.trim()); document.getElementById('void-manager-password')?.focus(); } }} />
          <TextField id="void-manager-password" fullWidth type="password" label="Senha do gestor" value={returnPassword} onChange={(event) => setReturnPassword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void returnSale(); }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={Boolean(returningId)} onClick={() => { setReturnTarget(null); setReturnBadgeCode(''); setReturnPassword(''); }} sx={{ textTransform: 'none' }}>Cancelar</Button>
        <Button variant="contained" disabled={Boolean(returningId) || !returnBadgeCode.trim() || !returnPassword} onClick={() => void returnSale()} sx={{ textTransform: 'none' }}>{returningId ? 'Validando…' : 'Autorizar estorno'}</Button>
      </DialogActions>
    </Dialog>
  </div>;
}

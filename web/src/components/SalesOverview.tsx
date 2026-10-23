'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { apiFetch, unwrap } from '@/lib/api';
import type { OperatorSummary, PaymentMethod, Sale } from '@/components/sales/types';
import { panelSx } from '@/components/sales/types';
import { SalesMetrics } from '@/components/sales/SalesMetrics';
import { SalesHistory } from '@/components/sales/SalesHistory';
import { SalesOperators } from '@/components/sales/SalesOperators';
import { SaleDetails } from '@/components/sales/SaleDetails';

function unwrapList<T>(payload: unknown): T[] {
  const value = unwrap<unknown>(payload as never);
  return Array.isArray(value) ? value as T[] : [];
}

function isToday(value: string, today: Date) {
  const date = new Date(value);
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export function SalesOverview() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState<'todas' | PaymentMethod>('todas');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [today, setToday] = useState<Date | null>(null);

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

  const todaysSales = useMemo(() => today ? sales.filter((sale) => isToday(sale.vendido_em, today)) : [], [sales, today]);
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

  return <Stack spacing={2.25} sx={{ pb: 2 }}>
    <Box>
      <Typography component="span" sx={{ color: 'var(--muted)', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>ACOMPANHAMENTO</Typography>
      <Typography component="h1" sx={{ mt: 0.3, color: 'var(--ink)', font: '800 clamp(24px,2.5vw,30px) Manrope,sans-serif', letterSpacing: '-.5px' }}>Vendas</Typography>
      <Typography sx={{ mt: 0.3, color: 'var(--muted)', fontSize: 14 }}>Histórico e resultados das vendas registradas.</Typography>
    </Box>

    <SalesMetrics count={todaysSales.length} revenue={revenue} average={average} operators={operators.length} ready={Boolean(today)} />
    {error && <Paper sx={{ ...panelSx, px: 2, py: 1.5, color: '#b42318' }}>{error}</Paper>}

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0,2.1fr) minmax(290px,.9fr)' }, gap: 1.75, alignItems: 'start' }}>
      <SalesHistory sales={visibleSales} selectedId={selected?.id ?? ''} filter={filter} search={search} loading={loading} onSelect={setSelectedId} onFilter={setFilter} onSearch={setSearch} />
      <Stack spacing={1.75}>
        <SalesOperators operators={operators} loading={loading} />
        <SaleDetails sale={selected} />
      </Stack>
    </Box>
  </Stack>;
}

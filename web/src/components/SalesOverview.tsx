'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { Box, Chip, CircularProgress, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { apiFetch, unwrap } from '@/lib/api';

type PaymentMethod = 'pix' | 'dinheiro' | 'debito' | 'credito';
type Sale = {
  id: string;
  valor_total: number | string;
  vendido_em: string;
  vendedor?: string | null;
  cliente_nome?: string | null;
  forma_pagamento?: PaymentMethod | null;
  itens?: Array<{ id: string; produto_nome: string; quantidade: number; preco_unitario: number | string; subtotal: number | string }>;
};

const paymentLabels: Record<PaymentMethod, string> = { pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito' };
const money = (value: unknown) => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateTime = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const panelSx = { border: '1px solid var(--line)', borderRadius: '14px', bgcolor: 'var(--card)', color: 'var(--ink)', boxShadow: '0 4px 16px #0f172a08' };

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
  const operators = useMemo(() => {
    const grouped = new Map<string, { count: number; total: number }>();
    for (const sale of todaysSales) {
      const name = sale.vendedor?.trim() || 'Operador não informado';
      const current = grouped.get(name) ?? { count: 0, total: 0 };
      current.count += 1;
      current.total += Number(sale.valor_total);
      grouped.set(name, current);
    }
    return [...grouped.entries()].sort((a, b) => b[1].total - a[1].total);
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

  const metrics = [
    { label: 'Vendas hoje', value: String(todaysSales.length), caption: 'Vendas concluídas hoje', icon: 'mdi:receipt-text-outline' },
    { label: 'Faturamento', value: money(revenue), caption: 'Soma das vendas de hoje', icon: 'mdi:cash-multiple' },
    { label: 'Ticket médio', value: money(average), caption: 'Valor médio por venda hoje', icon: 'mdi:chart-line' },
    { label: 'Operadores', value: String(operators.length), caption: 'Com vendas registradas hoje', icon: 'mdi:account-tie-outline' },
  ];

  return <Stack spacing={2.25} sx={{ pb: 2 }}>
    <Box>
      <Typography component="span" sx={{ color: 'var(--muted)', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>ACOMPANHAMENTO</Typography>
      <Typography component="h1" sx={{ mt: 0.3, color: 'var(--ink)', font: '800 clamp(24px,2.5vw,30px) Manrope,sans-serif', letterSpacing: '-.5px' }}>Vendas</Typography>
      <Typography sx={{ mt: 0.3, color: 'var(--muted)', fontSize: 14 }}>Histórico e resultados das vendas registradas.</Typography>
    </Box>

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', lg: 'repeat(4,minmax(0,1fr))' }, gap: 1.5 }}>
      {metrics.map((metric) => <Paper key={metric.label} component="article" sx={{ ...panelSx, minWidth: 0, p: { xs: 1.5, md: 1.9 } }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ color: 'var(--muted)', fontSize: 12, fontWeight: 600 }}>{metric.label}</Typography>
          <Box sx={{ width: 32, height: 32, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '10px', bgcolor: 'color-mix(in srgb, var(--primary) 9%, var(--card))', color: 'var(--primary)' }}><Icon icon={metric.icon} width={19} height={19} /></Box>
        </Stack>
        <Typography sx={{ mt: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--ink)', font: '800 clamp(19px,2vw,25px) Manrope,sans-serif', whiteSpace: 'nowrap' }}>{today ? metric.value : '—'}</Typography>
        <Typography sx={{ mt: 0.35, color: 'var(--muted)', fontSize: 11 }}>{metric.caption}</Typography>
      </Paper>)}
    </Box>

    {error && <Paper sx={{ ...panelSx, px: 2, py: 1.5, color: '#b42318' }}>{error}</Paper>}

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0,2.1fr) minmax(290px,.9fr)' }, gap: 1.75, alignItems: 'start' }}>
      <Paper component="section" sx={{ ...panelSx, minWidth: 0, overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ p: 1.75, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', gap: 1.25 }}>
          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 800 }}>Histórico de vendas</Typography>
          <TextField size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nº da venda, operador ou cliente" slotProps={{ htmlInput: { 'aria-label': 'Buscar venda' }, input: { startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" width={17} height={17} /></InputAdornment> } }} sx={{ width: { xs: '100%', md: 270 }, '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: 12, bgcolor: 'var(--card)', color: 'var(--ink)' } }} />
        </Stack>
        <Box sx={{ px: 1.5, pb: 1.25 }}>
          <ToggleButtonGroup exclusive value={filter} onChange={(_, value) => { if (value) setFilter(value); }} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.65, '& .MuiToggleButtonGroup-grouped': { m: 0, border: '1px solid var(--line) !important', borderRadius: '99px !important' } }}>
            {(['todas', 'pix', 'dinheiro', 'debito', 'credito'] as const).map((value) => <ToggleButton key={value} value={value} sx={{ minHeight: 30, px: 1.35, py: 0.3, color: 'var(--muted)', fontSize: 11, textTransform: 'none', '&.Mui-selected': { color: 'var(--primary)', bgcolor: 'color-mix(in srgb, var(--primary) 9%, var(--card))', borderColor: 'var(--primary) !important' } }}>{value === 'todas' ? 'Todas' : paymentLabels[value]}</ToggleButton>)}
          </ToggleButtonGroup>
        </Box>
        <TableContainer sx={{ maxHeight: { xs: 450, lg: 580 }, borderTop: '1px solid var(--line)' }}>
          <Table stickyHeader size="small" aria-label="Histórico de vendas" sx={{ minWidth: 690, '& .MuiTableCell-root': { borderColor: 'var(--line)', color: 'var(--ink)', fontSize: 11, whiteSpace: 'nowrap' } }}>
            <TableHead><TableRow>{['Venda', 'Data e hora', 'Operador', 'Itens', 'Pagamento', 'Total', 'Status'].map((label) => <TableCell key={label} sx={{ bgcolor: 'var(--surface-soft) !important', color: 'var(--muted) !important', fontSize: '10px !important', fontWeight: '800 !important', textTransform: 'uppercase' }}>{label}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow> : visibleSales.map((sale) => <TableRow key={sale.id} hover selected={sale.id === selected?.id} onClick={() => setSelectedId(sale.id)} sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: 'color-mix(in srgb, var(--primary) 8%, var(--card))' }, '&.Mui-selected:hover': { bgcolor: 'color-mix(in srgb, var(--primary) 12%, var(--card))' } }}>
                <TableCell sx={{ color: 'var(--primary) !important', fontWeight: '700 !important' }}>#{sale.id.slice(0, 8).toUpperCase()}</TableCell>
                <TableCell>{dateTime(sale.vendido_em)}</TableCell><TableCell>{sale.vendedor || '—'}</TableCell><TableCell align="center">{sale.itens?.reduce((count, item) => count + Number(item.quantidade), 0) ?? 0}</TableCell><TableCell>{sale.forma_pagamento ? paymentLabels[sale.forma_pagamento] : 'Não informado'}</TableCell><TableCell sx={{ fontWeight: '700 !important' }}>{money(sale.valor_total)}</TableCell><TableCell><Chip size="small" label="Concluída" sx={{ height: 21, bgcolor: 'color-mix(in srgb, #2563eb 11%, var(--card))', color: '#1d4ed8', fontSize: 10, fontWeight: 700 }} /></TableCell>
              </TableRow>)}
              {!loading && !visibleSales.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'var(--muted) !important' }}>Nenhuma venda encontrada para esses filtros.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Stack spacing={1.75}>
        <Paper component="section" sx={{ ...panelSx, p: 1.9 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}><Typography component="h2" sx={{ fontSize: 15, fontWeight: 800 }}>Operadores</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 11 }}>Hoje</Typography></Stack>
          {loading ? <CircularProgress size={22} sx={{ m: 2 }} /> : operators.length ? operators.map(([name, data]) => <Stack key={name} direction="row" sx={{ py: 1.15, alignItems: 'center', justifyContent: 'space-between', gap: 1, borderBottom: '1px solid var(--line)', '&:last-child': { borderBottom: 0, pb: 0 } }}>
            <Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: 12, fontWeight: 700 }}>{name}</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 10 }}>{data.count} venda(s)</Typography></Box><Typography sx={{ fontSize: 12, fontWeight: 700 }}>{money(data.total)}</Typography>
          </Stack>) : <Typography sx={{ py: 1.5, color: 'var(--muted)', fontSize: 12 }}>Ainda não há vendas de hoje.</Typography>}
        </Paper>

        <Paper component="section" sx={{ ...panelSx, p: 1.9 }}>
          {selected ? <>
            <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}><Box><Typography component="h2" sx={{ fontSize: 15, fontWeight: 800 }}>Venda #{selected.id.slice(0, 8).toUpperCase()}</Typography><Typography sx={{ mt: 0.25, color: 'var(--muted)', fontSize: 10 }}>{selected.vendedor || 'Operador não informado'} · {selected.forma_pagamento ? paymentLabels[selected.forma_pagamento] : 'Pagamento não informado'} · {dateTime(selected.vendido_em)}</Typography></Box><Chip size="small" label="Concluída" sx={{ height: 21, bgcolor: 'color-mix(in srgb, #2563eb 11%, var(--card))', color: '#1d4ed8', fontSize: 10, fontWeight: 700 }} /></Stack>
            {selected.cliente_nome && <Typography sx={{ mt: 1.4, color: 'var(--muted)', fontSize: 11 }}>Cliente: {selected.cliente_nome}</Typography>}
            <Stack spacing={0.9} sx={{ mt: 1.4, maxHeight: 250, overflowY: 'auto' }}>{selected.itens?.map((item) => <Stack key={item.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}><Typography sx={{ minWidth: 0, color: 'var(--muted)', fontSize: 11 }}>{item.quantidade} × {item.produto_nome}</Typography><Typography sx={{ flexShrink: 0, fontSize: 11, fontWeight: 600 }}>{money(item.subtotal)}</Typography></Stack>)}</Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mt: 1.5, pt: 1.25, borderTop: '1px solid var(--line)' }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>Total</Typography><Typography sx={{ color: 'var(--primary)', font: '800 24px Manrope,sans-serif' }}>{money(selected.valor_total)}</Typography></Stack>
          </> : <><Typography component="h2" sx={{ fontSize: 15, fontWeight: 800 }}>Detalhes da venda</Typography><Typography sx={{ mt: 1, color: 'var(--muted)', fontSize: 12 }}>Selecione uma venda no histórico para ver os itens.</Typography></>}
        </Paper>
      </Stack>
    </Box>
  </Stack>;
}

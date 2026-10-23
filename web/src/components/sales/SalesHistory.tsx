'use client';

import { Icon } from '@iconify/react';
import { Box, Chip, CircularProgress, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import type { PaymentMethod, Sale } from './types';
import { dateTime, money, panelSx, paymentLabels } from './types';

type Props = { sales: Sale[]; selectedId: string; filter: 'todas' | PaymentMethod; search: string; loading: boolean; onSelect: (id: string) => void; onFilter: (value: 'todas' | PaymentMethod) => void; onSearch: (value: string) => void };

export function SalesHistory({ sales, selectedId, filter, search, loading, onSelect, onFilter, onSearch }: Props) {
  return <Paper component="section" sx={{ ...panelSx, minWidth: 0, overflow: 'hidden' }}>
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ p: 1.75, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', gap: 1.25 }}>
      <Typography component="h2" sx={{ fontSize: 16, fontWeight: 800 }}>Histórico de vendas</Typography>
      <TextField size="small" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Nº da venda, operador ou cliente" slotProps={{ htmlInput: { 'aria-label': 'Buscar venda' }, input: { startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" width={17} height={17} /></InputAdornment> } }} sx={{ width: { xs: '100%', md: 270 }, '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: 12, bgcolor: 'var(--card)', color: 'var(--ink)' } }} />
    </Stack>
    <Box sx={{ px: 1.5, pb: 1.25 }}>
      <ToggleButtonGroup exclusive value={filter} onChange={(_, value) => { if (value) onFilter(value); }} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.65, '& .MuiToggleButtonGroup-grouped': { m: 0, border: '1px solid var(--line) !important', borderRadius: '99px !important' } }}>
        {(['todas', 'pix', 'dinheiro', 'debito', 'credito'] as const).map((value) => <ToggleButton key={value} value={value} sx={{ minHeight: 30, px: 1.35, py: 0.3, color: 'var(--muted)', fontSize: 11, textTransform: 'none', '&.Mui-selected': { color: 'var(--primary)', bgcolor: 'color-mix(in srgb, var(--primary) 9%, var(--card))', borderColor: 'var(--primary) !important' } }}>{value === 'todas' ? 'Todas' : paymentLabels[value]}</ToggleButton>)}
      </ToggleButtonGroup>
    </Box>
    <TableContainer sx={{ maxHeight: { xs: 450, lg: 580 }, borderTop: '1px solid var(--line)' }}>
      <Table stickyHeader size="small" aria-label="Histórico de vendas" sx={{ minWidth: 690, '& .MuiTableCell-root': { borderColor: 'var(--line)', color: 'var(--ink)', fontSize: 11, whiteSpace: 'nowrap' } }}>
        <TableHead><TableRow>{['Venda', 'Data e hora', 'Operador', 'Itens', 'Pagamento', 'Total', 'Status'].map((label) => <TableCell key={label} sx={{ bgcolor: 'var(--surface-soft) !important', color: 'var(--muted) !important', fontSize: '10px !important', fontWeight: '800 !important', textTransform: 'uppercase' }}>{label}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow> : sales.map((sale) => <TableRow key={sale.id} hover selected={sale.id === selectedId} onClick={() => onSelect(sale.id)} sx={{ cursor: 'pointer', '&.Mui-selected': { bgcolor: 'color-mix(in srgb, var(--primary) 8%, var(--card))' }, '&.Mui-selected:hover': { bgcolor: 'color-mix(in srgb, var(--primary) 12%, var(--card))' } }}>
            <TableCell sx={{ color: 'var(--primary) !important', fontWeight: '700 !important' }}>#{sale.id.slice(0, 8).toUpperCase()}</TableCell><TableCell>{dateTime(sale.vendido_em)}</TableCell><TableCell>{sale.vendedor || '—'}</TableCell><TableCell align="center">{sale.itens?.reduce((count, item) => count + Number(item.quantidade), 0) ?? 0}</TableCell><TableCell>{sale.forma_pagamento ? paymentLabels[sale.forma_pagamento] : 'Não informado'}</TableCell><TableCell sx={{ fontWeight: '700 !important' }}>{money(sale.valor_total)}</TableCell><TableCell><Chip size="small" label="Concluída" sx={{ height: 21, bgcolor: 'color-mix(in srgb, #2563eb 11%, var(--card))', color: '#1d4ed8', fontSize: 10, fontWeight: 700 }} /></TableCell>
          </TableRow>)}
          {!loading && !sales.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'var(--muted) !important' }}>Nenhuma venda encontrada para esses filtros.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>;
}

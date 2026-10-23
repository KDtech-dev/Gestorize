'use client';

import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import type { OperatorSummary } from './types';
import { money, panelSx } from './types';

export function SalesOperators({ operators, loading }: { operators: OperatorSummary[]; loading: boolean }) {
  return <Paper component="section" sx={{ ...panelSx, p: 1.9 }}>
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}><Typography component="h2" sx={{ fontSize: 15, fontWeight: 800 }}>Operadores</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 11 }}>Hoje</Typography></Stack>
    {loading ? <CircularProgress size={22} sx={{ m: 2 }} /> : operators.length ? operators.map((operator) => <Stack key={operator.name} direction="row" sx={{ py: 1.15, alignItems: 'center', justifyContent: 'space-between', gap: 1, borderBottom: '1px solid var(--line)', '&:last-child': { borderBottom: 0, pb: 0 } }}>
      <Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: 12, fontWeight: 700 }}>{operator.name}</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 10 }}>{operator.count} venda(s)</Typography></Box><Typography sx={{ fontSize: 12, fontWeight: 700 }}>{money(operator.total)}</Typography>
    </Stack>) : <Typography sx={{ py: 1.5, color: 'var(--muted)', fontSize: 12 }}>Ainda não há vendas de hoje.</Typography>}
  </Paper>;
}

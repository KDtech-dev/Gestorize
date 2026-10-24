'use client';

import { Icon } from '@iconify/react';
import { Autocomplete, Box, Button, InputAdornment, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import type { PaymentMethod } from './types';
import { money } from './types';

export type SaleCustomer = { id: string; nome: string };
export type SaleQuote = {
  id: string;
  titulo: string;
  cliente_id: string;
  cliente?: SaleCustomer;
  valor_total: number | string;
  status: string;
  itens: Array<{ id: string; produto_id: string; quantidade: number; preco_unitario: number | string; produto?: { id: string; nome: string; codigo_barras?: string; preco_venda: number | string; estoque: number } | null }>;
};
export type DiscountMode = 'percent' | 'amount';

type Props = {
  canSelectCustomer: boolean;
  canSelectQuote: boolean;
  customers: SaleCustomer[];
  selectedCustomer: SaleCustomer | null;
  availableQuotes: SaleQuote[];
  selectedQuote: SaleQuote | null;
  approvedQuotesAvailable: boolean;
  subtotal: number;
  appliedDiscount: number;
  total: number;
  discountMode: DiscountMode;
  discountInput: string;
  discountDescription: string;
  paymentMethod: PaymentMethod;
  busy: boolean;
  canCreateSale: boolean;
  cartCount: number;
  quoteItemsComplete: boolean;
  quoteStockAvailable: boolean;
  onSelectCustomer: (customer: SaleCustomer | null) => void;
  onSelectQuote: (quote: SaleQuote | null) => void;
  onDiscountModeChange: (mode: DiscountMode) => void;
  onDiscountChange: (value: string) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onFinish: () => void;
  onCancel: () => void;
};

const panelSx = { border: '1px solid var(--line)', borderRadius: '14px', bgcolor: 'var(--card)', color: 'var(--ink)', boxShadow: '0 5px 18px #0f172a0a' };
const paymentMethods: Array<{ value: PaymentMethod; label: string; icon: string }> = [
  { value: 'pix', label: 'Pix', icon: 'mdi:lightning-bolt-outline' },
  { value: 'dinheiro', label: 'Dinheiro', icon: 'mdi:cash' },
  { value: 'debito', label: 'Débito', icon: 'mdi:card-outline' },
  { value: 'credito', label: 'Crédito', icon: 'mdi:credit-card-outline' },
];

export function SalesCheckout(props: Props) {
  return <Stack className="sales-checkout" sx={{ minWidth: 0, minHeight: { lg: 'calc(100vh - 114px)' }, gap: 1.5 }}>
    <Box className="sales-checkout-actions" sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 1 }}>
      <Button variant="outlined" disabled={props.busy} onClick={props.onCancel} sx={{ minHeight: 46, borderColor: 'var(--line)', borderRadius: '9px', color: 'var(--ink)', fontSize: 12, textTransform: 'none' }}>Cancelar venda</Button>
      <Button className="sales-finish-button" variant="contained" disabled={!props.cartCount || props.busy || !props.canCreateSale || !props.quoteItemsComplete || !props.quoteStockAvailable} onClick={props.onFinish} startIcon={<Icon icon="mdi:check" width={19} height={19} />} sx={{ minHeight: { xs: 47, sm: 50 }, px: { xs: 1.25, sm: 2.5 }, border: '1px solid #005ce4', borderRadius: '10px', bgcolor: '#005ce4', color: '#fff', fontSize: { xs: 16, sm: 17 }, fontWeight: 700, textTransform: 'none', boxShadow: '0 5px 14px #005ce433', transition: 'background .16s,box-shadow .16s,transform .16s', '&:hover': { transform: 'translateY(-1px)', bgcolor: '#0048b8', boxShadow: '0 7px 18px #005ce440' }, '&.Mui-disabled': { opacity: 0.6, bgcolor: '#005ce4', color: '#fff' } }}>{props.busy ? 'Registrando venda…' : 'Finalizar venda'}</Button>
    </Box>

    {props.canSelectCustomer && <Paper className="sales-checkout-card sales-context-card" sx={{ ...panelSx, p: 2, flexShrink: 0 }}>
      <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 800 }}>Cliente</Typography>
      <Autocomplete
        options={props.customers}
        value={props.selectedCustomer}
        onChange={(_, customer) => props.onSelectCustomer(customer)}
        getOptionLabel={(customer) => customer.nome}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText="Nenhum cliente encontrado."
        renderInput={(params) => <TextField {...params} placeholder="Buscar cliente..." size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: 'var(--card)', color: 'var(--ink)', fontSize: 12 } }} />}
      />
    </Paper>}

    {props.canSelectQuote && <Paper className="sales-checkout-card sales-context-card" sx={{ ...panelSx, p: 2, flexShrink: 0 }}>
      <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 800 }}>Orçamento</Typography>
      <Autocomplete
        options={props.availableQuotes}
        value={props.selectedQuote}
        onChange={(_, quote) => props.onSelectQuote(quote)}
        getOptionLabel={(quote) => `${quote.titulo} · ${quote.cliente?.nome ?? 'Cliente'}`}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText={props.selectedCustomer ? 'Nenhum orçamento aprovado disponível para este cliente.' : 'Nenhum orçamento aprovado disponível.'}
        renderInput={(params) => <TextField {...params} placeholder="Buscar orçamento aprovado..." size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: 'var(--card)', color: 'var(--ink)', fontSize: 12 } }} />}
      />
      {props.selectedQuote && <Typography sx={{ mt: 0.8, color: 'var(--muted)', fontSize: 11 }}>Itens e preços do orçamento aprovado serão usados nesta venda.</Typography>}
      {!props.approvedQuotesAvailable && <Typography sx={{ mt: 0.8, color: 'var(--muted)', fontSize: 11 }}>Nenhum orçamento aprovado e disponível para venda.</Typography>}
    </Paper>}

    <Paper className="sales-checkout-card sales-summary-card" sx={{ ...panelSx, p: 2, flexShrink: 0 }}>
      <Typography sx={{ mb: 1.5, fontSize: 14, fontWeight: 800 }}>Resumo</Typography>
      <Stack sx={{ gap: 1 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}><Typography sx={{ color: 'var(--muted)', fontSize: 12 }}>Subtotal</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 12 }}>{money(props.subtotal)}</Typography></Stack>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}><Typography sx={{ color: 'var(--muted)', fontSize: 12 }}>Desconto {props.discountInput ? `(${props.discountDescription})` : ''}</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 12 }}>− {money(props.appliedDiscount)}</Typography></Stack>
        <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', pt: 1.25, mt: 0.5, borderTop: '1px solid var(--line)' }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>Total</Typography><Typography sx={{ color: '#1d4ed8', font: '800 29px Manrope,sans-serif' }}>{money(props.total)}</Typography></Stack>
      </Stack>
    </Paper>

    <Paper className="sales-checkout-card sales-discount-card" sx={{ ...panelSx, p: 2, flexShrink: 0 }}>
      <Typography sx={{ mb: 1.1, fontSize: 14, fontWeight: 800 }}>Desconto</Typography>
      <Box role="group" aria-label="Formato do desconto" sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 0.75, mb: 1 }}>
        {([
          { value: 'percent', label: 'Percentual (%)' },
          { value: 'amount', label: 'Valor (R$)' },
        ] as const).map((option) => <Button
          key={option.value}
          type="button"
          aria-pressed={props.discountMode === option.value}
          variant={props.discountMode === option.value ? 'contained' : 'outlined'}
          onClick={() => props.onDiscountModeChange(option.value)}
          sx={{ minWidth: 0, minHeight: 36, px: 0.75, borderRadius: '8px', borderColor: 'var(--line)', bgcolor: props.discountMode === option.value ? '#1d4ed8' : 'transparent', color: props.discountMode === option.value ? '#fff' : 'var(--muted)', fontSize: { xs: 10, sm: 11 }, fontWeight: 700, textTransform: 'none', whiteSpace: 'nowrap', '&:hover': { borderColor: '#1d4ed8', bgcolor: props.discountMode === option.value ? '#1e40af' : '#1d4ed80d' } }}
        >{option.label}</Button>)}
      </Box>
      <TextField
        fullWidth
        size="small"
        type="number"
        value={props.discountInput}
        onChange={(event) => props.onDiscountChange(event.target.value)}
        placeholder="0"
        slotProps={{
          htmlInput: { min: 0, max: props.discountMode === 'percent' ? 100 : undefined, step: '0.01', inputMode: 'decimal', 'aria-label': props.discountMode === 'percent' ? 'Desconto percentual' : 'Desconto em reais' },
          input: props.discountMode === 'amount'
            ? { startAdornment: <InputAdornment position="start">R$</InputAdornment> }
            : { endAdornment: <InputAdornment position="end">%</InputAdornment> },
        }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: 'var(--card)', color: 'var(--ink)', fontSize: 13 } }}
      />
      <Typography sx={{ mt: 0.75, color: 'var(--muted)', fontSize: 11 }}>
        {props.discountInput ? `Aplicando ${props.discountDescription}` : 'Nenhum desconto aplicado.'}
      </Typography>
    </Paper>

    <Paper className="sales-checkout-card sales-payment-card" sx={{ ...panelSx, p: 2, flexShrink: 0 }}>
      <Typography sx={{ mb: 1.25, fontSize: 14, fontWeight: 800 }}>Forma de pagamento</Typography>
      <ToggleButtonGroup exclusive value={props.paymentMethod} onChange={(_, value: PaymentMethod | null) => { if (value) props.onPaymentMethodChange(value); }} sx={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 0.75, '& .MuiToggleButtonGroup-grouped': { m: 0, border: '1px solid var(--line) !important', borderRadius: '8px !important' } }}>
        {paymentMethods.map((method) => <ToggleButton key={method.value} value={method.value} sx={{ minHeight: 42, display: 'flex', gap: 0.7, color: 'var(--ink)', fontSize: 11, textTransform: 'none', '&.Mui-selected': { bgcolor: '#1d4ed81a', borderColor: '#1d4ed8 !important', color: '#1d4ed8' }, '&.Mui-selected:hover': { bgcolor: '#1d4ed826' } }}><Icon icon={method.icon} width={17} height={17} />{method.label}</ToggleButton>)}
      </ToggleButtonGroup>
    </Paper>

  </Stack>;
}

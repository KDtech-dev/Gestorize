'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { Alert, Box, Button, ButtonBase, Collapse, IconButton, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import { canSell, useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { SalesCheckout, type DiscountMode, type SaleCustomer, type SaleQuote } from '@/components/sales/SalesCheckout';
import type { PaymentMethod } from '@/components/sales/types';

type Product = { id: string; nome: string; codigo_barras?: string; preco_venda: number | string; estoque: number };
type Customer = SaleCustomer;
type Quote = SaleQuote & { itens: Array<SaleQuote['itens'][number] & { produto?: Product | null }> };
type Sale = { id: string; usuario_id?: string; valor_total: number | string; vendido_em: string; vendedor?: string; cliente_nome?: string; orcamento_id?: string | null; forma_pagamento?: PaymentMethod | null; itens?: Array<{ id: string; produto_nome: string; quantidade: number; preco_unitario: number | string; subtotal: number | string }> };
type CartRow = { produto: Product; quantidade: number; precoUnitario?: number };

function list<T>(payload: unknown): T[] {
  let node = payload as { data?: unknown };
  for (let i = 0; i < 3 && node && !Array.isArray(node); i++) node = node.data as typeof node;
  return Array.isArray(node) ? node as T[] : [];
}

const money = (value: unknown) => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const panelSx = { border: '1px solid var(--line)', borderRadius: '14px', bgcolor: 'var(--card)', color: 'var(--ink)', boxShadow: '0 5px 18px #0f172a0a' };

export function SalesDesk() {
  const { can, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartRow[]>([]);
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [quoteId, setQuoteId] = useState('');
  const [discountMode, setDiscountMode] = useState<DiscountMode>('percent');
  const [discountInput, setDiscountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState('');

  const load = async () => {
    const [productData, salesData, customerData, quoteData] = await Promise.all([
      apiFetch<unknown>('/produtos'), can('vendas.ver') ? apiFetch<unknown>('/vendas') : Promise.resolve([]),
      can('clientes.ver') ? apiFetch<unknown>('/clientes') : Promise.resolve([]),
      can('orcamentos.ver') ? apiFetch<unknown>('/orcamentos') : Promise.resolve([]),
    ]);
    const loadedSales = list<Sale>(salesData);
    const soldQuoteIds = new Set(loadedSales.map((sale) => sale.orcamento_id).filter((id): id is string => Boolean(id)));
    setProducts(list<Product>(productData));
    setSales(can('vendas.ver') ? loadedSales.filter((sale) => sale.usuario_id === user?.id) : []);
    setCustomers(list<Customer>(customerData));
    setQuotes(list<Quote>(quoteData).filter((quote) => quote.status === 'aprovado' && !soldQuoteIds.has(quote.id)));
  };

  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString('pt-BR'));
    load().catch((reason) => setError(reason instanceof Error ? reason.message : 'Erro ao carregar vendas.')).finally(() => setLoading(false));
  }, []);

  const matchingProducts = useMemo(() => products.filter((product) => product.estoque > 0 && `${product.nome} ${product.codigo_barras ?? ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).slice(0, 8), [products, search]);
  const rowPrice = (row: CartRow) => row.precoUnitario ?? Number(row.produto.preco_venda);
  const subtotal = cart.reduce((sum, row) => sum + rowPrice(row) * row.quantidade, 0);
  const rawDiscount = Math.max(0, Number(discountInput) || 0);
  const appliedPercentage = Math.min(rawDiscount, 100);
  const appliedDiscount = Math.min(subtotal, discountMode === 'percent' ? subtotal * appliedPercentage / 100 : rawDiscount);
  const total = Math.max(0, subtotal - appliedDiscount);
  const discountDescription = discountMode === 'percent'
    ? `${appliedPercentage.toLocaleString('pt-BR')}% · ${money(appliedDiscount)}`
    : money(appliedDiscount);
  const itemCount = cart.reduce((sum, item) => sum + item.quantidade, 0);
  const selectedQuote = quotes.find((quote) => quote.id === quoteId);
  const selectedCustomer = customers.find((customer) => customer.id === customerId) ?? null;
  const availableQuotes = quotes.filter((quote) => !customerId || quote.cliente_id === customerId);
  const quoteItemsComplete = !selectedQuote || cart.length === selectedQuote.itens.length;
  const quoteStockAvailable = cart.every((row) => row.quantidade <= row.produto.estoque);

  const addProduct = (product: Product) => {
    setCart((current) => {
      const existing = current.find((row) => row.produto.id === product.id);
      if (existing) return current.map((row) => row.produto.id === product.id ? { ...row, quantidade: Math.min(row.quantidade + 1, product.estoque) } : row);
      return [...current, { produto: product, quantidade: 1 }];
    });
    setSearch(''); setShowResults(false); setError('');
  };

  const changeQuantity = (productId: string, delta: number) => setCart((items) => items.map((item) => item.produto.id === productId ? { ...item, quantidade: Math.min(item.produto.estoque, Math.max(1, item.quantidade + delta)) } : item));

  const selectQuote = (id: string) => {
    setQuoteId(id);
    setSearch('');
    setShowResults(false);
    setError('');
    const quote = quotes.find((item) => item.id === id);
    if (!quote) {
      setCart([]);
      return;
    }
    const quoteRows = quote.itens.map((item) => {
      const product = products.find((candidate) => candidate.id === item.produto_id) ?? item.produto;
      return product ? { produto: product, quantidade: Number(item.quantidade), precoUnitario: Number(item.preco_unitario) } : null;
    }).filter((row): row is { produto: Product; quantidade: number; precoUnitario: number } => row !== null);
    const groupedRows = new Map<string, CartRow & { total: number }>();
    for (const row of quoteRows) {
      const current = groupedRows.get(row.produto.id) ?? { produto: row.produto, quantidade: 0, total: 0, precoUnitario: 0 };
      current.quantidade += row.quantidade;
      current.total += row.precoUnitario * row.quantidade;
      current.precoUnitario = current.total / current.quantidade;
      groupedRows.set(row.produto.id, current);
    }
    const cartRows = [...groupedRows.values()].map(({ total: _total, ...row }) => row);
    setCart(cartRows);
    setCustomerId(quote.cliente_id);
    if (quoteRows.length !== quote.itens.length) setError('Um ou mais produtos deste orçamento não estão disponíveis para venda.');
    else if (cartRows.some((row) => row.quantidade > row.produto.estoque)) setError('O estoque atual não cobre todos os itens do orçamento selecionado.');
  };

  const selectCustomer = (customer: Customer | null) => {
    const nextCustomerId = customer?.id ?? '';
    setCustomerId(nextCustomerId);
    if (quoteId && quotes.find((quote) => quote.id === quoteId)?.cliente_id !== nextCustomerId) {
      setQuoteId('');
      setCart([]);
    }
  };

  async function registerSale() {
    if (!cart.length || !canSell(user)) return;
    setBusy(true); setError('');
    try {
      await apiFetch('/vendas', { method: 'POST', body: JSON.stringify({ cliente_id: customerId || null, orcamento_id: quoteId || null, forma_pagamento: paymentMethod, desconto: appliedDiscount, itens: cart.map(({ produto, quantidade }) => ({ produto_id: produto.id, quantidade })) }) });
      setCart([]); setCustomerId(''); setQuoteId(''); setDiscountInput(''); setDiscountMode('percent'); setPaymentMethod('pix'); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível registrar a venda.'); }
    finally { setBusy(false); }
  }

  return (
    <Box className="sales-desk-page" sx={{ minHeight: '100vh', bgcolor: 'var(--surface-soft)', color: 'var(--ink)' }}>
      <Box component="header" className="sales-desk-topbar" sx={{ minHeight: 72, px: { xs: 1.5, md: 3 }, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'var(--top-navigation-bg)', color: 'var(--top-navigation-fg)' }}>
        <ButtonBase component={Link} href="/" aria-label="Voltar à visão geral" sx={{ width: 34, height: 34, borderRadius: '9px', color: 'inherit', '&:hover': { bgcolor: '#ffffff20' } }}><Icon icon="mdi:arrow-left" width={21} height={21} /></ButtonBase>
        <Icon icon="mdi:cart-outline" width={22} height={22} />
        <Typography component="h1" sx={{ fontSize: 21, fontWeight: 800 }}>Nova venda</Typography>
        <Box sx={{ px: 1.2, py: 0.55, borderRadius: 99, bgcolor: 'var(--top-navigation-fg)', color: 'var(--top-navigation-bg)', fontSize: 13, fontWeight: 700 }}>Em andamento</Box>
        {can('vendas.ver') && <Button onClick={() => setHistoryOpen((open) => !open)} startIcon={<Icon icon="mdi:history" width={19} height={19} />} sx={{ ml: { xs: 0, md: 1 }, px: 1, color: 'inherit', fontSize: 14, textTransform: 'none', whiteSpace: 'nowrap' }}>Histórico ({sales.length})</Button>}
        <Stack direction="row" sx={{ alignItems: 'center', gap: { xs: 1, md: 2.5 }, ml: 'auto', fontSize: 13 }}>
          <Typography sx={{ color: 'inherit', fontSize: 'inherit' }}>Caixa web</Typography>
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: 'inherit', fontSize: 'inherit' }}>Operador: {user?.name ?? '—'}</Typography>
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: 'inherit', fontSize: 'inherit' }}>{dateLabel}</Typography>
        </Stack>
      </Box>

      {can('vendas.ver') && <Collapse in={historyOpen} unmountOnExit>
        <Box sx={{ px: { xs: 1.5, md: 2.5 }, pt: 1.5 }}>
          <Paper sx={{ ...panelSx, p: { xs: 1.5, md: 2 } }}>
            {loading ? <Typography sx={{ py: 2, color: 'var(--muted)', fontSize: 13 }}>Carregando histórico…</Typography> : sales.length ? sales.map((sale) => <Box key={sale.id} sx={{ borderBottom: '1px solid var(--line)' }}>
              <ButtonBase onClick={() => setExpanded(expanded === sale.id ? null : sale.id)} sx={{ width: '100%', minHeight: 58, display: 'flex', justifyContent: 'flex-start', gap: 1.25, textAlign: 'left' }}>
                <Icon icon="mdi:receipt-text-outline" width={20} height={20} color="#1d4ed8" />
                <Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 15, fontWeight: 700 }}>{sale.cliente_nome || 'Venda sem cliente'}</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 13 }}>{new Date(sale.vendido_em).toLocaleString('pt-BR')} · {sale.itens?.length ?? 0} produto(s)</Typography></Box>
                <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{money(sale.valor_total)}</Typography>
                <Icon icon={expanded === sale.id ? 'mdi:chevron-up' : 'mdi:chevron-down'} width={18} height={18} />
              </ButtonBase>
              <Collapse in={expanded === sale.id}><Box sx={{ pl: 4, pb: 1.25 }}>{sale.itens?.map((item) => <Stack key={item.id} direction="row" sx={{ justifyContent: 'space-between', gap: 1, py: 0.5, color: 'var(--muted)', fontSize: 11 }}><span>{item.produto_nome} × {item.quantidade}</span><span>{money(item.subtotal)}</span></Stack>)}</Box></Collapse>
            </Box>) : <Typography sx={{ py: 2, color: 'var(--muted)', fontSize: 13 }}>Nenhuma venda registrada.</Typography>}
          </Paper>
        </Box>
      </Collapse>}

      <Box className="sales-desk-layout" sx={{ p: { xs: 1.5, md: 2.5 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr', xl: 'minmax(0,1fr) 520px' }, alignItems: 'start', gap: 2, minHeight: 'calc(100vh - 72px)' }}>
        <Paper component="section" className="sales-product-panel" sx={{ ...panelSx, p: { xs: 1.5, md: 2.25 }, minWidth: 0, minHeight: { lg: 'calc(100vh - 114px)' }, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ position: 'relative', display: 'flex', gap: 1, mb: 1.75 }}>
            <Box sx={{ minWidth: 0, flex: 1, height: 56, px: 1.5, display: 'flex', alignItems: 'center', gap: 1.1, border: '1px solid #1d4ed8', borderRadius: '10px', bgcolor: 'var(--card)' }}>
              <TextField fullWidth variant="standard" disabled={Boolean(quoteId)} value={search} onChange={(event) => { setSearch(event.target.value); setShowResults(Boolean(event.target.value)); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); setShowResults(Boolean(search.trim())); } }} placeholder={quoteId ? 'Itens carregados do orçamento selecionado' : 'Buscar produto por nome ou código...'} slotProps={{ htmlInput: { 'aria-label': 'Buscar produto por nome ou código' }, input: { startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" width={20} height={20} color="#1d4ed8" /></InputAdornment> } }} sx={{ minWidth: 0, flex: 1, '& .MuiInputBase-root': { color: 'var(--ink)', fontSize: 17 }, '& .MuiInputBase-input': { height: 54, boxSizing: 'border-box', py: 0 }, '& .MuiInput-root:before, & .MuiInput-root:after': { display: 'none' }, '& .MuiInputBase-input::placeholder': { color: 'var(--muted)', opacity: 0.8 }, '& .MuiInputBase-input.Mui-disabled': { opacity: 0.7, WebkitTextFillColor: 'var(--muted)' } }} />
            </Box>
            <Button variant="contained" disabled={Boolean(quoteId)} onClick={() => setShowResults(Boolean(search.trim()))} sx={{ minWidth: 96, minHeight: 56, borderRadius: '10px', bgcolor: '#1d4ed8', textTransform: 'none', fontSize: 15, fontWeight: 800, '&:hover': { bgcolor: '#1e40af' } }}>Buscar</Button>
            {showResults && search.trim() && <Paper sx={{ ...panelSx, position: 'absolute', zIndex: 5, top: 52, left: 0, right: 90, maxHeight: 300, overflowY: 'auto', p: 0.75 }}>
              {matchingProducts.map((product) => <ButtonBase key={product.id} onClick={() => addProduct(product)} sx={{ width: '100%', minHeight: 58, px: 1, display: 'flex', justifyContent: 'flex-start', textAlign: 'left', borderRadius: '8px', '&:hover': { bgcolor: 'var(--surface-soft)' } }}>
                <Icon icon="mdi:package-variant-closed" width={23} height={23} color="#1d4ed8" />
                <Box sx={{ minWidth: 0, flex: 1, ml: 1.25, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{product.nome}</Typography>
                  <Typography sx={{ color: 'var(--muted)', fontSize: 13 }}>Cód. {product.codigo_barras || '—'} · Estoque: {product.estoque}</Typography>
                </Box>
                <Typography sx={{ mr: 1, fontSize: 15, fontWeight: 700 }}>{money(product.preco_venda)}</Typography>
                <Icon icon="mdi:plus-circle-outline" width={19} height={19} color="#1d4ed8" />
              </ButtonBase>)}
              {!matchingProducts.length && <Typography sx={{ px: 1.5, py: 2, color: 'var(--muted)', fontSize: 13 }}>Nenhum produto disponível com esse nome ou código.</Typography>}
            </Paper>}
          </Box>

          <Box sx={{ flex: 1, minHeight: 240, border: '1px solid var(--line)', borderRadius: '11px', overflow: 'hidden', bgcolor: 'var(--card)' }}>
            <Stack direction="row" sx={{ minHeight: 58, px: 1.75, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
              <Typography sx={{ fontSize: 17, fontWeight: 800 }}>Produtos da venda</Typography>
              <Typography sx={{ color: 'var(--muted)', fontSize: 14 }}>{cart.length} itens · {itemCount} unidades</Typography>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr) 88px 92px 30px', md: '36px minmax(0,1fr) 104px 120px 120px 28px' }, alignItems: 'center', minHeight: 40, px: 1.5, bgcolor: 'color-mix(in srgb, var(--primary) 8%, var(--card))', color: 'var(--muted)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>#</Box><Box>Produto</Box><Box sx={{ textAlign: 'center' }}>Qtd.</Box><Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'right' }}>Valor unit.</Box><Box sx={{ textAlign: 'right' }}>Subtotal</Box><Box />
            </Box>
            {cart.map((row, index) => { const { produto, quantidade } = row; return <Box key={`${produto.id}-${index}`} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr) 88px 92px 30px', md: '36px minmax(0,1fr) 104px 120px 120px 28px' }, alignItems: 'center', gap: 0.5, minHeight: 72, px: 1.5, borderBottom: '1px solid var(--line)', '&:nth-of-type(even)': { bgcolor: 'color-mix(in srgb, var(--surface-soft) 55%, var(--card))' } }}>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, color: 'var(--muted)', fontSize: 13 }}>{String(index + 1).padStart(2, '0')}</Typography>
              <Box sx={{ minWidth: 0 }}><Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 16, fontWeight: 700 }}>{produto.nome}</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 13 }}>Cód. {produto.codigo_barras || '—'}</Typography></Box>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'center', gap: 0.3, px: 0.25, py: 0.2, border: '1px solid #bfdbfe', borderRadius: 99 }}>
                {!quoteId && <IconButton size="small" aria-label={`Diminuir quantidade de ${produto.nome}`} onClick={() => changeQuantity(produto.id, -1)} sx={{ width: 22, height: 22, color: '#1d4ed8', fontSize: 14 }}>−</IconButton>}
                <Typography sx={{ minWidth: 19, textAlign: 'center', fontSize: 14, fontWeight: 700 }}>{quantidade}</Typography>
                {!quoteId && <IconButton size="small" aria-label={`Aumentar quantidade de ${produto.nome}`} onClick={() => changeQuantity(produto.id, 1)} sx={{ width: 22, height: 22, color: '#1d4ed8', fontSize: 14 }}>+</IconButton>}
              </Stack>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'right', fontSize: 14 }}>{money(rowPrice(row))}</Typography>
              <Typography sx={{ textAlign: 'right', fontSize: 14, fontWeight: 700 }}>{money(rowPrice(row) * quantidade)}</Typography>
              <IconButton size="small" disabled={Boolean(quoteId)} aria-label={`Remover ${produto.nome}`} onClick={() => setCart((items) => items.filter((item) => item.produto.id !== produto.id))} sx={{ color: 'var(--muted)' }}><Icon icon="mdi:close" width={17} height={17} /></IconButton>
            </Box>; })}
            {!cart.length && <Box sx={{ minHeight: 240, display: 'grid', placeItems: 'center', px: 2, color: 'var(--muted)', textAlign: 'center' }}><Box><Icon icon="mdi:cart-plus" width={38} height={38} /><Typography sx={{ mt: 0.75, fontSize: 16 }}>Adicione produtos para iniciar a venda.</Typography></Box></Box>}
          </Box>
          {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
        </Paper>

        <SalesCheckout
          canSelectCustomer={can('clientes.ver')}
          canSelectQuote={can('orcamentos.ver')}
          customers={customers}
          selectedCustomer={selectedCustomer}
          availableQuotes={availableQuotes}
          selectedQuote={selectedQuote ?? null}
          approvedQuotesAvailable={quotes.length > 0}
          subtotal={subtotal}
          appliedDiscount={appliedDiscount}
          total={total}
          discountMode={discountMode}
          discountInput={discountInput}
          discountDescription={discountDescription}
          paymentMethod={paymentMethod}
          busy={busy}
          canCreateSale={canSell(user)}
          cartCount={cart.length}
          quoteItemsComplete={quoteItemsComplete}
          quoteStockAvailable={quoteStockAvailable}
          onSelectCustomer={selectCustomer}
          onSelectQuote={(quote) => selectQuote(quote?.id ?? '')}
          onDiscountModeChange={setDiscountMode}
          onDiscountChange={setDiscountInput}
          onPaymentMethodChange={setPaymentMethod}
          onFinish={() => void registerSale()}
          onCancel={() => { setCart([]); setCustomerId(''); setQuoteId(''); setDiscountInput(''); setDiscountMode('percent'); setError(''); }}
        />
      </Box>

    </Box>
  );
}

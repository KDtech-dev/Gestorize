'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { Alert, Box, Button, ButtonBase, Collapse, IconButton, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

type Product = { id: string; nome: string; codigo_barras?: string; preco_venda: number | string; estoque: number };
type Customer = { id: string; nome: string };
type PaymentMethod = 'pix' | 'dinheiro' | 'debito' | 'credito';
type Sale = { id: string; valor_total: number | string; vendido_em: string; vendedor?: string; cliente_nome?: string; forma_pagamento?: PaymentMethod | null; itens?: Array<{ id: string; produto_nome: string; quantidade: number; preco_unitario: number | string; subtotal: number | string }> };
type CartRow = { produto: Product; quantidade: number };

function list<T>(payload: unknown): T[] {
  let node = payload as { data?: unknown };
  for (let i = 0; i < 3 && node && !Array.isArray(node); i++) node = node.data as typeof node;
  return Array.isArray(node) ? node as T[] : [];
}

const money = (value: unknown) => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const paymentMethods: Array<{ value: PaymentMethod; label: string; icon: string }> = [
  { value: 'pix', label: 'Pix', icon: 'mdi:lightning-bolt-outline' },
  { value: 'dinheiro', label: 'Dinheiro', icon: 'mdi:cash' },
  { value: 'debito', label: 'Débito', icon: 'mdi:card-outline' },
  { value: 'credito', label: 'Crédito', icon: 'mdi:credit-card-outline' },
];

const panelSx = { border: '1px solid var(--line)', borderRadius: '14px', bgcolor: 'var(--card)', color: 'var(--ink)', boxShadow: '0 5px 18px #0f172a0a' };

export function SalesDesk() {
  const { can, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartRow[]>([]);
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState('');

  const load = async () => {
    const [productData, salesData, customerData] = await Promise.all([
      apiFetch<unknown>('/produtos'), apiFetch<unknown>('/vendas'),
      can('clientes.ver') ? apiFetch<unknown>('/clientes') : Promise.resolve([]),
    ]);
    setProducts(list<Product>(productData)); setSales(list<Sale>(salesData)); setCustomers(list<Customer>(customerData));
  };

  useEffect(() => {
    setDateLabel(new Date().toLocaleDateString('pt-BR'));
    load().catch((reason) => setError(reason instanceof Error ? reason.message : 'Erro ao carregar vendas.')).finally(() => setLoading(false));
  }, []);

  const matchingProducts = useMemo(() => products.filter((product) => product.estoque > 0 && `${product.nome} ${product.codigo_barras ?? ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).slice(0, 8), [products, search]);
  const subtotal = cart.reduce((sum, row) => sum + Number(row.produto.preco_venda) * row.quantidade, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantidade, 0);

  const addProduct = (product: Product) => {
    setCart((current) => {
      const existing = current.find((row) => row.produto.id === product.id);
      if (existing) return current.map((row) => row.produto.id === product.id ? { ...row, quantidade: Math.min(row.quantidade + 1, product.estoque) } : row);
      return [...current, { produto: product, quantidade: 1 }];
    });
    setSearch(''); setShowResults(false); setError('');
  };

  const changeQuantity = (productId: string, delta: number) => setCart((items) => items.map((item) => item.produto.id === productId ? { ...item, quantidade: Math.min(item.produto.estoque, Math.max(1, item.quantidade + delta)) } : item));

  async function registerSale() {
    if (!cart.length || !can('vendas.criar')) return;
    setBusy(true); setError('');
    try {
      await apiFetch('/vendas', { method: 'POST', body: JSON.stringify({ cliente_id: customerId || null, forma_pagamento: paymentMethod, itens: cart.map(({ produto, quantidade }) => ({ produto_id: produto.id, quantidade })) }) });
      setCart([]); setCustomerId(''); setPaymentMethod('pix'); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível registrar a venda.'); }
    finally { setBusy(false); }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--surface-soft)', color: 'var(--ink)' }}>
      <Box component="header" sx={{ minHeight: 64, px: { xs: 1.5, md: 3 }, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#1d4ed8', color: '#fff' }}>
        <ButtonBase component={Link} href="/" aria-label="Voltar à visão geral" sx={{ width: 34, height: 34, borderRadius: '9px', color: 'inherit', '&:hover': { bgcolor: '#ffffff20' } }}><Icon icon="mdi:arrow-left" width={21} height={21} /></ButtonBase>
        <Icon icon="mdi:cart-outline" width={22} height={22} />
        <Typography component="h1" sx={{ fontSize: 16, fontWeight: 800 }}>Nova venda</Typography>
        <Box sx={{ px: 1, py: 0.45, borderRadius: 99, bgcolor: '#ffffff', color: '#1d4ed8', fontSize: 11, fontWeight: 700 }}>Em andamento</Box>
        <Button onClick={() => setHistoryOpen((open) => !open)} startIcon={<Icon icon="mdi:history" width={17} height={17} />} sx={{ ml: { xs: 0, md: 1 }, px: 1, color: '#fff', fontSize: 11, textTransform: 'none', whiteSpace: 'nowrap' }}>Histórico ({sales.length})</Button>
        <Stack direction="row" sx={{ alignItems: 'center', gap: { xs: 1, md: 2.5 }, ml: 'auto', fontSize: 11 }}>
          <Typography sx={{ color: 'inherit', fontSize: 'inherit' }}>Caixa web</Typography>
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: 'inherit', fontSize: 'inherit' }}>Operador: {user?.name ?? '—'}</Typography>
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: 'inherit', fontSize: 'inherit' }}>{dateLabel}</Typography>
        </Stack>
      </Box>

      <Collapse in={historyOpen} unmountOnExit>
        <Box sx={{ px: { xs: 1.5, md: 2.5 }, pt: 1.5 }}>
          <Paper sx={{ ...panelSx, p: { xs: 1.5, md: 2 } }}>
            {loading ? <Typography sx={{ py: 2, color: 'var(--muted)', fontSize: 13 }}>Carregando histórico…</Typography> : sales.length ? sales.map((sale) => <Box key={sale.id} sx={{ borderBottom: '1px solid var(--line)' }}>
              <ButtonBase onClick={() => setExpanded(expanded === sale.id ? null : sale.id)} sx={{ width: '100%', minHeight: 58, display: 'flex', justifyContent: 'flex-start', gap: 1.25, textAlign: 'left' }}>
                <Icon icon="mdi:receipt-text-outline" width={20} height={20} color="#1d4ed8" />
                <Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 12, fontWeight: 700 }}>{sale.cliente_nome || 'Venda sem cliente'}</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 10 }}>{new Date(sale.vendido_em).toLocaleString('pt-BR')} · {sale.itens?.length ?? 0} produto(s)</Typography></Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{money(sale.valor_total)}</Typography>
                <Icon icon={expanded === sale.id ? 'mdi:chevron-up' : 'mdi:chevron-down'} width={18} height={18} />
              </ButtonBase>
              <Collapse in={expanded === sale.id}><Box sx={{ pl: 4, pb: 1.25 }}>{sale.itens?.map((item) => <Stack key={item.id} direction="row" sx={{ justifyContent: 'space-between', gap: 1, py: 0.5, color: 'var(--muted)', fontSize: 11 }}><span>{item.produto_nome} × {item.quantidade}</span><span>{money(item.subtotal)}</span></Stack>)}</Box></Collapse>
            </Box>) : <Typography sx={{ py: 2, color: 'var(--muted)', fontSize: 13 }}>Nenhuma venda registrada.</Typography>}
          </Paper>
        </Box>
      </Collapse>

      <Box sx={{ p: { xs: 1.5, md: 2.5 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) minmax(260px,320px)', xl: 'minmax(0,1fr) 340px' }, alignItems: 'stretch', gap: 2, minHeight: 'calc(100vh - 64px)' }}>
        <Paper component="section" sx={{ ...panelSx, p: { xs: 1.5, md: 2.25 }, minWidth: 0, minHeight: { lg: 'calc(100vh - 114px)' }, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ position: 'relative', display: 'flex', gap: 1, mb: 1.75 }}>
            <Box sx={{ minWidth: 0, flex: 1, height: 46, px: 1.5, display: 'flex', alignItems: 'center', gap: 1.1, border: '1px solid #1d4ed8', borderRadius: '10px', bgcolor: 'var(--card)' }}>
              <Icon icon="mdi:magnify" width={20} height={20} color="#1d4ed8" />
              <Box component="input" value={search} onChange={(event: React.ChangeEvent<HTMLInputElement>) => { setSearch(event.target.value); setShowResults(Boolean(event.target.value)); }} onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { event.preventDefault(); setShowResults(Boolean(search.trim())); } }} placeholder="Buscar produto por nome ou código..." sx={{ width: '100%', minWidth: 0, border: 0, outline: 0, bgcolor: 'transparent', color: 'var(--ink)', fontSize: 14, '&::placeholder': { color: 'var(--muted)', opacity: 0.8 } }} />
            </Box>
            <Button variant="contained" onClick={() => setShowResults(Boolean(search.trim()))} sx={{ minWidth: 82, borderRadius: '9px', bgcolor: '#1d4ed8', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#1e40af' } }}>Buscar</Button>
            {showResults && search.trim() && <Paper sx={{ ...panelSx, position: 'absolute', zIndex: 5, top: 52, left: 0, right: 90, maxHeight: 300, overflowY: 'auto', p: 0.75 }}>
              {matchingProducts.map((product) => <ButtonBase key={product.id} onClick={() => addProduct(product)} sx={{ width: '100%', minHeight: 58, px: 1, display: 'flex', justifyContent: 'flex-start', textAlign: 'left', borderRadius: '8px', '&:hover': { bgcolor: 'var(--surface-soft)' } }}>
                <Icon icon="mdi:package-variant-closed" width={21} height={21} color="#1d4ed8" />
                <Box sx={{ minWidth: 0, flex: 1, ml: 1.25, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{product.nome}</Typography>
                  <Typography sx={{ color: 'var(--muted)', fontSize: 11 }}>Cód. {product.codigo_barras || '—'} · Estoque: {product.estoque}</Typography>
                </Box>
                <Typography sx={{ mr: 1, fontSize: 13, fontWeight: 700 }}>{money(product.preco_venda)}</Typography>
                <Icon icon="mdi:plus-circle-outline" width={19} height={19} color="#1d4ed8" />
              </ButtonBase>)}
              {!matchingProducts.length && <Typography sx={{ px: 1.5, py: 2, color: 'var(--muted)', fontSize: 13 }}>Nenhum produto disponível com esse nome ou código.</Typography>}
            </Paper>}
          </Box>

          <Box sx={{ flex: 1, minHeight: 240, border: '1px solid var(--line)', borderRadius: '11px', overflow: 'hidden', bgcolor: 'var(--card)' }}>
            <Stack direction="row" sx={{ minHeight: 48, px: 1.75, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Produtos da venda</Typography>
              <Typography sx={{ color: 'var(--muted)', fontSize: 11 }}>{cart.length} itens · {itemCount} unidades</Typography>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr) auto auto', md: '36px minmax(0,1fr) 104px 120px 120px 28px' }, alignItems: 'center', minHeight: 34, px: 1.5, bgcolor: 'color-mix(in srgb, var(--primary) 8%, var(--card))', color: 'var(--muted)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>#</Box><Box>Produto</Box><Box sx={{ textAlign: 'center' }}>Qtd.</Box><Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'right' }}>Valor unit.</Box><Box sx={{ textAlign: 'right' }}>Subtotal</Box><Box />
            </Box>
            {cart.map(({ produto, quantidade }, index) => <Box key={produto.id} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr) auto auto', md: '36px minmax(0,1fr) 104px 120px 120px 28px' }, alignItems: 'center', gap: 0.5, minHeight: 58, px: 1.5, borderBottom: '1px solid var(--line)', '&:nth-of-type(even)': { bgcolor: 'color-mix(in srgb, var(--surface-soft) 55%, var(--card))' } }}>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, color: 'var(--muted)', fontSize: 11 }}>{String(index + 1).padStart(2, '0')}</Typography>
              <Box sx={{ minWidth: 0 }}><Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 700 }}>{produto.nome}</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 10 }}>Cód. {produto.codigo_barras || '—'}</Typography></Box>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'center', gap: 0.3, px: 0.25, py: 0.2, border: '1px solid #bfdbfe', borderRadius: 99 }}>
                <IconButton size="small" aria-label={`Diminuir quantidade de ${produto.nome}`} onClick={() => changeQuantity(produto.id, -1)} sx={{ width: 22, height: 22, color: '#1d4ed8', fontSize: 14 }}>−</IconButton>
                <Typography sx={{ minWidth: 15, textAlign: 'center', fontSize: 11, fontWeight: 700 }}>{quantidade}</Typography>
                <IconButton size="small" aria-label={`Aumentar quantidade de ${produto.nome}`} onClick={() => changeQuantity(produto.id, 1)} sx={{ width: 22, height: 22, color: '#1d4ed8', fontSize: 14 }}>+</IconButton>
              </Stack>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'right', fontSize: 12 }}>{money(produto.preco_venda)}</Typography>
              <Typography sx={{ textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{money(Number(produto.preco_venda) * quantidade)}</Typography>
              <IconButton size="small" aria-label={`Remover ${produto.nome}`} onClick={() => setCart((items) => items.filter((item) => item.produto.id !== produto.id))} sx={{ color: 'var(--muted)' }}><Icon icon="mdi:close" width={17} height={17} /></IconButton>
            </Box>)}
            {!cart.length && <Box sx={{ minHeight: 190, display: 'grid', placeItems: 'center', px: 2, color: 'var(--muted)', textAlign: 'center' }}><Box><Icon icon="mdi:cart-plus" width={32} height={32} /><Typography sx={{ mt: 0.75, fontSize: 13 }}>Adicione produtos para iniciar a venda.</Typography></Box></Box>}
          </Box>
          {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
        </Paper>

        <Stack sx={{ minWidth: 0, minHeight: { lg: 'calc(100vh - 114px)' }, gap: 1.5 }}>
          <Paper sx={{ ...panelSx, p: 2, flexShrink: 0 }}>
            <Typography sx={{ mb: 1.5, fontSize: 14, fontWeight: 800 }}>Resumo</Typography>
            <Stack sx={{ gap: 1 }}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}><Typography sx={{ color: 'var(--muted)', fontSize: 12 }}>Subtotal</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 12 }}>{money(subtotal)}</Typography></Stack>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}><Typography sx={{ color: 'var(--muted)', fontSize: 12 }}>Desconto</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 12 }}>{money(0)}</Typography></Stack>
              <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', pt: 1.25, mt: 0.5, borderTop: '1px solid var(--line)' }}><Typography sx={{ fontSize: 13, fontWeight: 800 }}>Total</Typography><Typography sx={{ color: '#1d4ed8', font: '800 29px Manrope,sans-serif' }}>{money(subtotal)}</Typography></Stack>
            </Stack>
          </Paper>

          {can('clientes.ver') && <Paper sx={{ ...panelSx, p: 2, flexShrink: 0 }}>
            <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 800 }}>Cliente</Typography>
            <Box component="select" value={customerId} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setCustomerId(event.target.value)} sx={{ width: '100%', height: 38, px: 1.25, border: '1px solid var(--line)', borderRadius: '8px', bgcolor: 'var(--card)', color: 'var(--ink)', fontSize: 12 }}><option value="">Venda sem cliente</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.nome}</option>)}</Box>
          </Paper>}

          <Paper sx={{ ...panelSx, p: 2, flexShrink: 0 }}>
            <Typography sx={{ mb: 1.25, fontSize: 14, fontWeight: 800 }}>Forma de pagamento</Typography>
            <ToggleButtonGroup exclusive value={paymentMethod} onChange={(_, value: PaymentMethod | null) => { if (value) setPaymentMethod(value); }} sx={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 0.75, '& .MuiToggleButtonGroup-grouped': { m: 0, border: '1px solid var(--line) !important', borderRadius: '8px !important' } }}>
              {paymentMethods.map((method) => <ToggleButton key={method.value} value={method.value} sx={{ minHeight: 42, display: 'flex', gap: 0.7, color: 'var(--ink)', fontSize: 11, textTransform: 'none', '&.Mui-selected': { bgcolor: '#1d4ed81a', borderColor: '#1d4ed8 !important', color: '#1d4ed8' }, '&.Mui-selected:hover': { bgcolor: '#1d4ed826' } }}><Icon icon={method.icon} width={17} height={17} />{method.label}</ToggleButton>)}
            </ToggleButtonGroup>
          </Paper>

          <Box sx={{ mt: 'auto', display: 'grid', gap: 1 }}>
            <Button variant="contained" disabled={!cart.length || busy || !can('vendas.criar')} onClick={() => void registerSale()} startIcon={<Icon icon="mdi:check" width={19} height={19} />} sx={{ minHeight: 50, borderRadius: '10px', bgcolor: '#1d4ed8', fontWeight: 800, textTransform: 'none', boxShadow: '0 6px 15px #1d4ed833', '&:hover': { bgcolor: '#1e40af' } }}>{busy ? 'Registrando venda…' : 'Finalizar venda'}</Button>
            <Button variant="outlined" disabled={busy} onClick={() => { setCart([]); setCustomerId(''); setError(''); }} sx={{ minHeight: 40, borderColor: 'var(--line)', borderRadius: '9px', color: 'var(--ink)', fontSize: 12, textTransform: 'none' }}>Cancelar venda</Button>
          </Box>
        </Stack>
      </Box>

    </Box>
  );
}

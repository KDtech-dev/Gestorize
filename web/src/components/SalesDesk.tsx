'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

type Product = { id: string; nome: string; codigo_barras?: string; preco_venda: number | string; estoque: number };
type Customer = { id: string; nome: string };
type Sale = { id: string; valor_total: number | string; vendido_em: string; vendedor?: string; cliente_nome?: string; itens?: Array<{ id: string; produto_nome: string; quantidade: number; preco_unitario: number | string; subtotal: number | string }> };
type CartRow = { produto: Product; quantidade: number };

function list<T>(payload: unknown): T[] {
  let node = payload as { data?: unknown };
  for (let i = 0; i < 3 && node && !Array.isArray(node); i++) node = node.data as typeof node;
  return Array.isArray(node) ? node as T[] : [];
}
const money = (value: unknown) => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function SalesDesk() {
  const { can } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartRow[]>([]);
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    const [productData, salesData, customerData] = await Promise.all([
      apiFetch<unknown>('/produtos'), apiFetch<unknown>('/vendas'),
      can('clientes.ver') ? apiFetch<unknown>('/clientes') : Promise.resolve([]),
    ]);
    setProducts(list<Product>(productData)); setSales(list<Sale>(salesData)); setCustomers(list<Customer>(customerData));
  };
  useEffect(() => { load().catch((reason) => setError(reason instanceof Error ? reason.message : 'Erro ao carregar vendas.')).finally(() => setLoading(false)); }, []);

  const matchingProducts = useMemo(() => products.filter((product) => product.estoque > 0 && `${product.nome} ${product.codigo_barras ?? ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).slice(0, 6), [products, search]);
  const total = cart.reduce((sum, row) => sum + Number(row.produto.preco_venda) * row.quantidade, 0);
  const addProduct = (product: Product) => {
    setCart((current) => {
      const existing = current.find((row) => row.produto.id === product.id);
      if (existing) return current.map((row) => row.produto.id === product.id ? { ...row, quantidade: Math.min(row.quantidade + 1, product.estoque) } : row);
      return [...current, { produto: product, quantidade: 1 }];
    });
    setSearch(''); setError('');
  };

  async function registerSale() {
    if (!cart.length) return;
    setBusy(true); setError('');
    try {
      await apiFetch('/vendas', { method: 'POST', body: JSON.stringify({ cliente_id: customerId || null, itens: cart.map(({ produto, quantidade }) => ({ produto_id: produto.id, quantidade })) }) });
      setCart([]); setCustomerId(''); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível registrar a venda.'); }
    finally { setBusy(false); }
  }

  return <>
    <div className="page-heading"><div><span className="eyebrow">PONTO DE VENDA</span><h1>Vendas</h1><p>Registre uma venda e acompanhe o histórico atualizado pela API.</p></div><div className="record-count"><strong>{sales.length}</strong><span>vendas</span></div></div>
    <div className="sales-layout">
      <section className="data-panel sale-builder"><div className="panel-heading"><div><h2>Nova venda</h2><p>Pesquise um produto e adicione ao carrinho.</p></div><span className="panel-tag">PDV</span></div>
        <div className="sale-search-wrap"><label className="search-field sale-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou código de barras" /></label>
          {!!search && <div className="product-results">{matchingProducts.map((product) => <button className="product-result" key={product.id} onClick={() => addProduct(product)}><span className="result-icon">▣</span><span className="result-copy"><strong>{product.nome}</strong><small>{product.codigo_barras || 'Sem código'} · Estoque: {product.estoque}</small></span><strong>{money(product.preco_venda)}</strong><span className="add-mark">+</span></button>)}{!matchingProducts.length && <p className="no-results">Nenhum produto disponível com esse nome ou código.</p>}</div>}
        </div>
        {can('clientes.ver') && <label className="field customer-select"><span>Cliente <small>(opcional)</small></span><select value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">Venda sem cliente</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.nome}</option>)}</select></label>}
        <div className="cart-title"><strong>Itens da venda</strong><span>{cart.reduce((sum, item) => sum + item.quantidade, 0)} itens</span></div>
        <div className="cart-items">{cart.map(({ produto, quantidade }) => <div className="cart-row" key={produto.id}><div className="result-icon">▣</div><div className="cart-product"><strong>{produto.nome}</strong><small>{money(produto.preco_venda)} cada</small></div><div className="quantity-control"><button onClick={() => setCart((items) => items.map((item) => item.produto.id === produto.id ? { ...item, quantidade: Math.max(1, item.quantidade - 1) } : item))}>−</button><span>{quantidade}</span><button onClick={() => setCart((items) => items.map((item) => item.produto.id === produto.id ? { ...item, quantidade: Math.min(item.produto.estoque, item.quantidade + 1) } : item))}>+</button></div><strong className="cart-subtotal">{money(Number(produto.preco_venda) * quantidade)}</strong><button className="remove-item" aria-label={`Remover ${produto.nome}`} onClick={() => setCart((items) => items.filter((item) => item.produto.id !== produto.id))}>×</button></div>)}
          {!cart.length && <div className="cart-empty">Seu carrinho está vazio. Pesquise e selecione produtos acima.</div>}
        </div>
        {error && <div className="inline-error">{error}</div>}
        <div className="sale-total"><span>Total da venda</span><strong>{money(total)}</strong></div>
        <button className="primary-button full-button" disabled={!cart.length || busy || !can('vendas.criar')} onClick={() => void registerSale()}>{busy ? 'Registrando…' : !can('vendas.criar') ? 'Sem permissão para registrar venda' : 'Registrar venda'}<span>→</span></button>
      </section>
      <section className="data-panel history-panel"><div className="panel-heading"><div><h2>Histórico</h2><p>Vendas registradas no sistema.</p></div><span className="history-count">{sales.length}</span></div>
        {loading ? <div className="table-loading"><span className="spinner" />Carregando…</div> : <div className="sales-history">{sales.map((sale) => <article className="sale-history-item" key={sale.id}>
          <button className="sale-history-button" onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}><span className="sale-history-icon">▥</span><span className="sale-history-copy"><strong>{sale.cliente_nome || 'Venda sem cliente'}</strong><small>{new Date(sale.vendido_em).toLocaleString('pt-BR')} · {sale.itens?.length ?? 0} produto(s)</small></span><strong>{money(sale.valor_total)}</strong><span className="row-action">{expanded === sale.id ? '⌃' : '⌄'}</span></button>
          {expanded === sale.id && <div className="sale-detail">{sale.itens?.map((item) => <div key={item.id}><span>{item.produto_nome} × {item.quantidade}<small>{money(item.preco_unitario)} cada</small></span><strong>{money(item.subtotal)}</strong></div>)}<div className="sale-detail-total"><span>Total</span><strong>{money(sale.valor_total)}</strong></div></div>}
        </article>)}{!sales.length && <div className="empty-state compact"><span className="empty-icon">▥</span><h2>Sem vendas ainda</h2><p>As vendas registradas aparecerão aqui.</p></div>}</div>}
      </section>
    </div>
  </>;
}

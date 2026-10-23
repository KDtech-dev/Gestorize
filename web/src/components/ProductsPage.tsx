'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RecordEditor } from '@/components/RecordEditor';
import { UserAvatar } from '@/components/UserAvatar';

type Product = Record<string, any>;
type Category = { id: string; nome: string };
const PAGE_SIZE = 9;

function unwrapList(payload: unknown): Product[] {
  let current = payload as { data?: unknown };
  for (let i = 0; i < 4 && current && !Array.isArray(current); i++) current = current.data as typeof current;
  return Array.isArray(current) ? current as Product[] : [];
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
}

function ProductSummary({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return <article className="client-summary-card product-summary-card" style={{ '--summary-color': color } as CSSProperties}>
    <span className="client-summary-icon"><Icon icon={icon} width={22} height={22} /></span><span className="client-summary-label">{label}</span><strong>{value}</strong>
  </article>;
}

function ProductAction({ label, icon, onClick, danger = false }: { label: string; icon: string; onClick: () => void; danger?: boolean }) {
  return <button type="button" className={`client-action product-action${danger ? ' danger' : ''}`} aria-label={label} data-tooltip={label} onClick={(event) => { event.stopPropagation(); onClick(); }}>
    <Icon icon={icon} width={19} height={19} />
  </button>;
}

function ProductCard({ product, selected, onSelect, onEdit, onDelete }: { product: Product; selected: boolean; onSelect: () => void; onEdit: () => void; onDelete: () => void }) {
  const name = String(product.nome ?? 'Produto');
  const imageUrl = product.imagem_principal?.url ?? product.imagens?.find((image: Product) => image.principal)?.url ?? product.imagens?.[0]?.url;
  const stock = Number(product.estoque ?? 0);
  const unit = product.unidade_medida_sigla ? ` ${product.unidade_medida_sigla}` : '';
  return <article className={`client-card product-card${selected ? ' selected' : ''}`}>
    <div className="client-card-top product-card-top">
      <button type="button" className="client-card-identity" onClick={onSelect} aria-expanded={selected}>
        <UserAvatar name={name} imageUrl={imageUrl} fallbackIcon="mdi:package-variant-closed" size={58} className="client-card-avatar product-card-avatar" />
        <span className="client-card-identity-copy"><strong title={name}>{name}</strong><span>{product.codigo_barras ? `Código ${product.codigo_barras}` : 'Sem código de barras'}</span></span>
      </button>
      <span className={`product-stock-pill${stock > 0 ? ' available' : ' empty'}`}>{stock > 0 ? 'Em estoque' : 'Sem estoque'}</span>
    </div>
    <div className="product-card-highlights">
      <div><span>Preço de venda</span><strong>{money(product.preco_venda)}</strong></div>
      <div><span>Disponível</span><strong>{Number.isFinite(stock) ? `${stock}${unit}` : '—'}</strong></div>
    </div>
    {product.validade && <div className="product-expiry"><Icon icon="mdi:calendar-clock-outline" width={18} height={18} /><span>Validade</span><strong>{new Date(`${product.validade}T00:00:00`).toLocaleDateString('pt-BR')}</strong></div>}
    <div className="client-card-contact product-card-relations">
      <span><Icon icon="mdi:shape-outline" width={17} height={17} /><span title={product.categoria_titulo ?? ''}>{product.categoria_titulo || 'Sem categoria'}</span></span>
      <span><Icon icon="mdi:truck-outline" width={17} height={17} /><span title={product.fornecedor_razao_social ?? ''}>{product.fornecedor_razao_social || 'Sem fornecedor'}</span></span>
    </div>
    <footer className="client-card-footer">
      <span className="client-card-actions-label">Ações</span>
      <div className="client-card-actions">
        <ProductAction label={selected ? 'Ocultar detalhes' : 'Ver detalhes'} icon={selected ? 'mdi:chevron-up' : 'mdi:eye-outline'} onClick={onSelect} />
        <ProductAction label="Editar produto" icon="mdi:pencil-outline" onClick={onEdit} />
        <ProductAction label="Excluir produto" icon="mdi:trash-can-outline" onClick={onDelete} danger />
      </div>
    </footer>
    {selected && <div className="client-card-details product-card-details">
      <p><span>Preço de custo</span><strong>{money(product.preco_custo)}</strong></p>
      <p><span>Margem</span><strong>{Number(product.porcentagem_lucro ?? 0)}%</strong></p>
      <p><span>Unidade</span><strong>{product.unidade_medida_titulo ? `${product.unidade_medida_titulo}${unit}` : '—'}</strong></p>
    </div>}
  </article>;
}

function ProductsHeading({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return <header className="clients-page-heading">
    <div className="clients-heading-content"><span className="eyebrow"><Icon icon="mdi:package-variant-closed" width={19} height={19} /><span>CATÁLOGO</span></span><h1>Produtos</h1><p>Consulte preços, estoque e informações dos produtos da sua organização.</p></div>
    <div className="clients-heading-actions">{canCreate && <button className="primary-button" onClick={onCreate}><Icon icon="mdi:plus" width={20} height={20} />Novo produto</button>}</div>
  </header>;
}

function ProductFilters({ search, category, stockStatus, categories, count, onSearch, onCategory, onStockStatus }: { search: string; category: string; stockStatus: string; categories: Category[]; count: number; onSearch: (value: string) => void; onCategory: (value: string) => void; onStockStatus: (value: string) => void }) {
  return <>
    <header className="client-directory-heading"><div><span className="eyebrow">INVENTÁRIO</span><h2>Todos os produtos</h2><p>Busque pelo nome ou código, ou filtre por categoria.</p></div><span className="client-results-count">{count} resultado{count === 1 ? '' : 's'}</span></header>
    <div className="client-filters">
      <label className="search-field"><Icon icon="mdi:magnify" width={20} height={20} /><input type="search" aria-label="Buscar produtos ao digitar" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar por nome, código ou categoria" /></label>
      <FormControl fullWidth className="client-type-select-field">
        <InputLabel id="product-category-label">Categoria</InputLabel>
        <Select labelId="product-category-label" id="product-category-select" value={category} label="Categoria" onChange={(event) => onCategory(String(event.target.value))} MenuProps={{ disablePortal: true, slotProps: { paper: { sx: { backgroundColor: 'var(--card)', color: 'var(--ink)' } } } }}>
          <MenuItem value="">Todas as categorias</MenuItem>
          {categories.map((item) => <MenuItem key={item.id} value={item.id}>{item.nome}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl fullWidth className="client-type-select-field">
        <InputLabel id="product-stock-label">Estoque</InputLabel>
        <Select labelId="product-stock-label" id="product-stock-select" value={stockStatus} label="Estoque" onChange={(event) => onStockStatus(String(event.target.value))} MenuProps={{ disablePortal: true, slotProps: { paper: { sx: { backgroundColor: 'var(--card)', color: 'var(--ink)' } } } }}>
          <MenuItem value="">Todos os níveis</MenuItem>
          <MenuItem value="available">Com estoque</MenuItem>
          <MenuItem value="empty">Estoque zerado</MenuItem>
        </Select>
      </FormControl>
    </div>
  </>;
}

function ProductPagination({ page, totalPages, total, from, to, onChange }: { page: number; totalPages: number; total: number; from: number; to: number; onChange: (page: number) => void }) {
  if (!total) return null;
  return <nav className="client-pagination" aria-label="Paginação de produtos">
    <span>Exibindo <strong>{from}–{to}</strong> de <strong>{total}</strong> produtos</span>
    <div><button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Página anterior" title="Página anterior"><Icon icon="mdi:chevron-left" width={20} height={20} /></button><span>Página <strong>{page}</strong> de <strong>{totalPages}</strong></span><button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Próxima página" title="Próxima página"><Icon icon="mdi:chevron-right" width={20} height={20} /></button></div>
  </nav>;
}

export function ProductsPage() {
  const { can } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = async () => setProducts(unwrapList(await apiFetch<unknown>('/produtos')));
  useEffect(() => {
    Promise.all([apiFetch<unknown>('/produtos'), apiFetch<unknown>('/categorias').catch(() => [])])
      .then(([productPayload, categoryPayload]) => {
        setProducts(unwrapList(productPayload));
        setCategories(unwrapList(categoryPayload) as Category[]);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os produtos.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!can('produtos.criar')) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('novo') !== '1') return;
    setEditing(null);
    url.searchParams.delete('novo');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, [can]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const matchesCategory = !category || String(product.categoria_id ?? '') === category;
      const hasStock = Number(product.estoque) > 0;
      const matchesStock = !stockStatus || (stockStatus === 'available' ? hasStock : !hasStock);
      const matchesSearch = !term || [product.nome, product.codigo_barras, product.categoria_titulo, product.fornecedor_razao_social].some((value) => String(value ?? '').toLocaleLowerCase().includes(term));
      return matchesCategory && matchesStock && matchesSearch;
    });
  }, [products, search, category, stockStatus]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const inStock = products.filter((product) => Number(product.estoque) > 0).length;
  const outOfStock = products.length - inStock;

  async function saveProduct(payload: Product, id?: string) {
    await apiFetch(id ? `/produtos/${id}` : '/produtos', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await reload();
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Excluir ${String(product.nome ?? 'este produto')}? Essa ação não pode ser desfeita.`)) return;
    try {
      await apiFetch(`/produtos/${product.id}`, { method: 'DELETE' });
      await reload();
      if (selectedId === product.id) setSelectedId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível excluir o produto.');
    }
  }

  function changeFilter(value: string, setter: (value: string) => void) {
    setter(value);
    setPage(1);
  }

  return <div className="clients-page products-page">
    <ProductsHeading canCreate={can('produtos.criar')} onCreate={() => setEditing(null)} />
    <section className="client-summary-grid" aria-label="Resumo de produtos">
      <ProductSummary label="Total de produtos" value={loading ? '—' : products.length} icon="mdi:package-variant-closed" color="#005CE4" />
      <ProductSummary label="Com estoque" value={loading ? '—' : inStock} icon="mdi:check-circle-outline" color="#0f9f73" />
      <ProductSummary label="Sem estoque" value={loading ? '—' : outOfStock} icon="mdi:alert-circle-outline" color="#e58a16" />
    </section>

    <section className="client-directory">
      <ProductFilters search={search} category={category} stockStatus={stockStatus} categories={categories} count={filtered.length} onSearch={(value) => changeFilter(value, setSearch)} onCategory={(value) => changeFilter(value, setCategory)} onStockStatus={(value) => changeFilter(value, setStockStatus)} />
      {error && <div className="inline-error">{error}</div>}
      {loading ? <div className="table-loading"><span className="spinner" />Carregando produtos…</div> : pageItems.length ? <div className="client-card-grid">{pageItems.map((product) => <ProductCard key={String(product.id)} product={product} selected={selectedId === product.id} onSelect={() => setSelectedId(selectedId === product.id ? null : String(product.id))} onEdit={() => setEditing(product)} onDelete={() => void deleteProduct(product)} />)}</div> : <div className="empty-state compact"><span className="empty-icon"><Icon icon="mdi:package-variant-closed" /></span><h2>{search || category || stockStatus ? 'Nenhum produto encontrado' : 'Ainda não há produtos'}</h2><p>{search || category || stockStatus ? 'Ajuste os filtros para ver outros produtos.' : 'Cadastre o primeiro produto para começar.'}</p></div>}
      {!loading && <ProductPagination page={currentPage} totalPages={totalPages} total={filtered.length} from={(currentPage - 1) * PAGE_SIZE + 1} to={Math.min(currentPage * PAGE_SIZE, filtered.length)} onChange={setPage} />}
    </section>
    {editing !== undefined && <RecordEditor module="produtos" row={editing} onClose={() => setEditing(undefined)} onSave={saveProduct} />}
  </div>;
}

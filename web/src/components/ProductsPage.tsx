'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';
import { EntityActionButton, EntityDirectoryHeading, EntityPageHeading, EntityPagination, EntitySummaryCard } from '@/components/entities/EntityPageParts';

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

function ProductCard({ product, selected, canEdit, onSelect, onEdit, onDelete }: { product: Product; selected: boolean; canEdit: boolean; onSelect: () => void; onEdit: () => void; onDelete: () => void }) {
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
        <EntityActionButton label={selected ? 'Ocultar detalhes' : 'Ver detalhes'} icon={selected ? 'mdi:chevron-up' : 'mdi:eye-outline'} onClick={onSelect} />
        {canEdit && <EntityActionButton label="Editar produto" icon="mdi:pencil-outline" onClick={onEdit} />}
        <EntityActionButton label="Excluir produto" icon="mdi:trash-can-outline" onClick={onDelete} danger />
      </div>
    </footer>
    {selected && <div className="client-card-details product-card-details">
      <p><span>Preço de custo</span><strong>{money(product.preco_custo)}</strong></p>
      <p><span>Margem</span><strong>{Number(product.porcentagem_lucro ?? 0)}%</strong></p>
      <p><span>Unidade</span><strong>{product.unidade_medida_titulo ? `${product.unidade_medida_titulo}${unit}` : '—'}</strong></p>
    </div>}
  </article>;
}

function ProductFilters({ search, category, stockStatus, categories, count, onSearch, onCategory, onStockStatus }: { search: string; category: string; stockStatus: string; categories: Category[]; count: number; onSearch: (value: string) => void; onCategory: (value: string) => void; onStockStatus: (value: string) => void }) {
  return <>
    <EntityDirectoryHeading eyebrow="INVENTÁRIO" title="Todos os produtos" description="Busque pelo nome ou código, ou filtre por categoria." count={count} />
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

export function ProductsPage() {
  const router = useRouter();
  const { can } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
    router.replace('/produtos/nova');
  }, [can, router]);

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
    <EntityPageHeading eyebrow="CATÁLOGO" icon="mdi:package-variant-closed" title="Produtos" description="Consulte preços, estoque e informações dos produtos da sua organização." createLabel="Novo produto" canCreate={can('produtos.criar')} onCreate={() => router.push('/produtos/nova')} extraAction={{ label: 'Etiquetas', icon: 'mdi:tag-multiple-outline', onClick: () => router.push('/etiquetas') }} />
    <section className="client-summary-grid" aria-label="Resumo de produtos">
      <EntitySummaryCard compact label="Total de produtos" value={loading ? '—' : products.length} icon="mdi:package-variant-closed" color="#005CE4" />
      <EntitySummaryCard compact label="Com estoque" value={loading ? '—' : inStock} icon="mdi:check-circle-outline" color="#0f9f73" />
      <EntitySummaryCard compact label="Sem estoque" value={loading ? '—' : outOfStock} icon="mdi:alert-circle-outline" color="#e58a16" />
    </section>

    <section className="client-directory">
      <ProductFilters search={search} category={category} stockStatus={stockStatus} categories={categories} count={filtered.length} onSearch={(value) => changeFilter(value, setSearch)} onCategory={(value) => changeFilter(value, setCategory)} onStockStatus={(value) => changeFilter(value, setStockStatus)} />
      {error && <div className="inline-error">{error}</div>}
      {loading ? <div className="table-loading"><span className="spinner" />Carregando produtos…</div> : pageItems.length ? <div className="client-card-grid">{pageItems.map((product) => <ProductCard key={String(product.id)} product={product} selected={selectedId === String(product.id)} canEdit={can('produtos.editar')} onSelect={() => setSelectedId(selectedId === String(product.id) ? null : String(product.id))} onEdit={() => router.push(`/produtos/nova?id=${encodeURIComponent(String(product.id))}`)} onDelete={() => void deleteProduct(product)} />)}</div> : <div className="empty-state compact"><span className="empty-icon"><Icon icon="mdi:package-variant-closed" /></span><h2>{search || category || stockStatus ? 'Nenhum produto encontrado' : 'Ainda não há produtos'}</h2><p>{search || category || stockStatus ? 'Ajuste os filtros para ver outros produtos.' : 'Cadastre o primeiro produto para começar.'}</p></div>}
      {!loading && <EntityPagination noun="produtos" page={currentPage} totalPages={totalPages} total={filtered.length} from={(currentPage - 1) * PAGE_SIZE + 1} to={Math.min(currentPage * PAGE_SIZE, filtered.length)} onChange={setPage} />}
    </section>
  </div>;
}

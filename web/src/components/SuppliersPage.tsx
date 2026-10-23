'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RecordEditor } from '@/components/RecordEditor';
import { UserAvatar } from '@/components/UserAvatar';
import { EntityActionButton, EntityDirectoryHeading, EntityPageHeading, EntityPagination, EntitySummaryCard } from '@/components/entities/EntityPageParts';

type Supplier = Record<string, any>;
const PAGE_SIZE = 9;

function unwrapList(payload: unknown): Supplier[] {
  let current = payload as { data?: unknown };
  for (let i = 0; i < 4 && current && !Array.isArray(current); i++) current = current.data as typeof current;
  return Array.isArray(current) ? current as Supplier[] : [];
}

function cnpj(value: unknown) {
  const raw = String(value ?? '');
  const digits = raw.replace(/\D/g, '');
  return digits.length === 14 ? digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : raw || 'CNPJ não informado';
}

function SupplierCard({ supplier, selected, onSelect, onEdit, onDelete }: { supplier: Supplier; selected: boolean; onSelect: () => void; onEdit: () => void; onDelete: () => void }) {
  const name = String(supplier.nome ?? 'Fornecedor');
  const categories = Array.isArray(supplier.categorias) ? supplier.categorias as Supplier[] : [];
  const categoryNames = categories.map((category) => String(category.nome ?? '')).filter(Boolean);
  return <article className={`client-card supplier-card${selected ? ' selected' : ''}`}>
    <div className="client-card-top supplier-card-top">
      <button type="button" className="client-card-identity" onClick={onSelect} aria-expanded={selected}>
        <UserAvatar name={name} imageUrl={supplier.avatar_url ?? supplier.avatar} fallbackIcon="mdi:truck-outline" size={58} className="client-card-avatar supplier-card-avatar" />
        <span className="client-card-identity-copy"><strong title={name}>{name}</strong><span>{cnpj(supplier.cnpj)}</span></span>
      </button>
      <span className="supplier-primary-category" tabIndex={0} aria-label={categoryNames.length ? `Ramo principal: ${categoryNames[0]}. Passe o cursor para ver todos os ramos.` : 'Fornecedor sem ramo de atividade'} data-tooltip={categoryNames.length ? `Ramos: ${categoryNames.join(', ')}` : 'Sem ramo de atividade'}><span>{categoryNames[0] || 'Sem ramo'}</span></span>
    </div>
    <div className="client-card-contact supplier-card-contact">
      <span><Icon icon="mdi:email-outline" width={17} height={17} /><span title={supplier.email ?? ''}>{supplier.email || 'E-mail não informado'}</span></span>
      <span><Icon icon="mdi:phone-outline" width={17} height={17} /><span>{supplier.telefone || 'Telefone não informado'}</span></span>
    </div>
    <footer className="client-card-footer">
      <span className="client-card-actions-label">Ações</span>
      <div className="client-card-actions">
        <EntityActionButton label={selected ? 'Ocultar detalhes' : 'Ver detalhes'} icon={selected ? 'mdi:chevron-up' : 'mdi:eye-outline'} onClick={onSelect} />
        <EntityActionButton label="Editar fornecedor" icon="mdi:pencil-outline" onClick={onEdit} />
        <EntityActionButton label="Excluir fornecedor" icon="mdi:trash-can-outline" onClick={onDelete} danger />
      </div>
    </footer>
    {selected && <div className="client-card-details supplier-card-details">
      <p><span>Responsável</span><strong>{supplier.nome_responsavel || '—'}</strong></p>
      <p><span>Ramos de atividade</span><strong>{categoryNames.join(', ') || '—'}</strong></p>
      <p><span>Chave PIX</span><strong>{supplier.chave_pix || '—'}</strong></p>
      <p><span>Cidade</span><strong>{[supplier.endereco?.cidade, supplier.endereco?.estado].filter(Boolean).join(' / ') || '—'}</strong></p>
      <p><span>Endereço</span><strong>{[supplier.endereco?.logradouro, supplier.endereco?.numero].filter(Boolean).join(', ') || '—'}</strong></p>
    </div>}
  </article>;
}

function SupplierFilters({ search, category, categories, count, onSearch, onCategory }: { search: string; category: string; categories: string[]; count: number; onSearch: (value: string) => void; onCategory: (value: string) => void }) {
  return <>
    <EntityDirectoryHeading eyebrow="CADASTRO" title="Todos os fornecedores" description="Busque por nome, CNPJ, contato ou filtre pelo ramo de atividade." count={count} />
    <div className="client-filters">
      <label className="search-field"><Icon icon="mdi:magnify" width={20} height={20} /><input type="search" aria-label="Buscar fornecedores ao digitar" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar por nome, CNPJ, e-mail ou telefone" /></label>
      <FormControl fullWidth className="client-type-select-field">
        <InputLabel id="supplier-category-label">Ramo de atividade</InputLabel>
        <Select labelId="supplier-category-label" id="supplier-category-select" value={category} label="Ramo de atividade" onChange={(event) => onCategory(String(event.target.value))} MenuProps={{ disablePortal: true, slotProps: { paper: { sx: { backgroundColor: 'var(--card)', color: 'var(--ink)' } } } }}>
          <MenuItem value="">Todos os ramos</MenuItem>
          {categories.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </Select>
      </FormControl>
    </div>
  </>;
}

export function SuppliersPage() {
  const { can } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Supplier | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = async () => setSuppliers(unwrapList(await apiFetch<unknown>('/fornecedores')));
  useEffect(() => {
    apiFetch<unknown>('/fornecedores')
      .then((payload) => setSuppliers(unwrapList(payload)))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os fornecedores.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!can('fornecedores.criar')) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('novo') !== '1') return;
    setEditing(null);
    url.searchParams.delete('novo');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, [can]);

  const categories = useMemo(() => [...new Set(suppliers.flatMap((supplier) => Array.isArray(supplier.categorias) ? supplier.categorias.map((item: Supplier) => String(item.nome ?? '')).filter(Boolean) : []))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [suppliers]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return suppliers.filter((supplier) => {
      const categoryNames = Array.isArray(supplier.categorias) ? supplier.categorias.map((item: Supplier) => String(item.nome ?? '')) : [];
      const matchesCategory = !category || categoryNames.includes(category);
      const matchesSearch = !term || [supplier.nome, supplier.cnpj, supplier.email, supplier.telefone, supplier.nome_responsavel, ...categoryNames].some((value) => String(value ?? '').toLocaleLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [suppliers, search, category]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const withCategories = suppliers.filter((supplier) => Array.isArray(supplier.categorias) && supplier.categorias.length > 0).length;
  const withEmail = suppliers.filter((supplier) => !!supplier.email).length;

  async function saveSupplier(payload: Supplier, id?: string) {
    await apiFetch(id ? `/fornecedores/${id}` : '/fornecedores', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await reload();
  }

  async function deleteSupplier(supplier: Supplier) {
    if (!window.confirm(`Excluir ${String(supplier.nome ?? 'este fornecedor')}? Essa ação não pode ser desfeita.`)) return;
    try {
      await apiFetch(`/fornecedores/${supplier.id}`, { method: 'DELETE' });
      await reload();
      if (selectedId === supplier.id) setSelectedId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível excluir o fornecedor.');
    }
  }

  function changeFilter(value: string, setter: (value: string) => void) {
    setter(value);
    setPage(1);
  }

  return <div className="clients-page suppliers-page">
    <EntityPageHeading eyebrow="COMPRAS E PARCERIAS" icon="mdi:truck-outline" title="Fornecedores" description="Consulte contatos, ramos de atividade e dados dos seus parceiros." createLabel="Novo fornecedor" canCreate={can('fornecedores.criar')} onCreate={() => setEditing(null)} />
    <section className="client-summary-grid" aria-label="Resumo de fornecedores">
      <EntitySummaryCard label="Total de fornecedores" value={loading ? '—' : suppliers.length} icon="mdi:truck-outline" color="#005CE4" />
      <EntitySummaryCard label="Com ramo cadastrado" value={loading ? '—' : withCategories} icon="mdi:shape-outline" color="#0f9f73" />
      <EntitySummaryCard label="Com e-mail" value={loading ? '—' : withEmail} icon="mdi:email-outline" color="#8b5cf6" />
    </section>
    <section className="client-directory">
      <SupplierFilters search={search} category={category} categories={categories} count={filtered.length} onSearch={(value) => changeFilter(value, setSearch)} onCategory={(value) => changeFilter(value, setCategory)} />
      {error && <div className="inline-error">{error}</div>}
      {loading ? <div className="table-loading"><span className="spinner" />Carregando fornecedores…</div> : pageItems.length ? <div className="client-card-grid">{pageItems.map((supplier) => <SupplierCard key={String(supplier.id)} supplier={supplier} selected={selectedId === supplier.id} onSelect={() => setSelectedId(selectedId === supplier.id ? null : String(supplier.id))} onEdit={() => setEditing(supplier)} onDelete={() => void deleteSupplier(supplier)} />)}</div> : <div className="empty-state compact"><span className="empty-icon"><Icon icon="mdi:truck-outline" /></span><h2>{search || category ? 'Nenhum fornecedor encontrado' : 'Ainda não há fornecedores'}</h2><p>{search || category ? 'Ajuste os filtros para ver outros fornecedores.' : 'Cadastre o primeiro fornecedor para começar.'}</p></div>}
      {!loading && <EntityPagination noun="fornecedores" page={currentPage} totalPages={totalPages} total={filtered.length} from={(currentPage - 1) * PAGE_SIZE + 1} to={Math.min(currentPage * PAGE_SIZE, filtered.length)} onChange={setPage} />}
    </section>
    {editing !== undefined && <RecordEditor module="fornecedores" row={editing} onClose={() => setEditing(undefined)} onSave={saveSupplier} />}
  </div>;
}

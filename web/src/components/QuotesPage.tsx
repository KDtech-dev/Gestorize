'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RecordEditor } from '@/components/RecordEditor';
import { EntityActionButton, EntityDirectoryHeading, EntityPageHeading, EntityPagination, EntitySummaryCard } from '@/components/entities/EntityPageParts';

type Quote = Record<string, any>;
const PAGE_SIZE = 9;

function unwrapList(payload: unknown): Quote[] {
  let current = payload as { data?: unknown };
  for (let i = 0; i < 4 && current && !Array.isArray(current); i++) current = current.data as typeof current;
  return Array.isArray(current) ? current as Quote[] : [];
}

function statusOf(quote: Quote) { return String(quote.status ?? 'pendente').toLocaleLowerCase(); }
function statusLabel(status: string) {
  if (status === 'aprovado') return 'Aprovado';
  if (status === 'vendido') return 'Vendido';
  if (status === 'cancelado') return 'Cancelado';
  return 'Pendente';
}
function currency(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
}
function date(value: unknown) {
  if (!value) return '—';
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('pt-BR');
}
function clientName(quote: Quote) { return String(quote.cliente?.nome ?? quote.cliente_nome ?? 'Cliente não informado'); }

function QuoteCard({ quote, selected, canEdit, canDelete, canApprove, onSelect, onEdit, onDelete, onApprove }: {
  quote: Quote; selected: boolean; canEdit: boolean; canDelete: boolean; canApprove: boolean;
  onSelect: () => void; onEdit: () => void; onDelete: () => void; onApprove: () => void;
}) {
  const status = statusOf(quote);
  const items = Array.isArray(quote.itens) ? quote.itens as Quote[] : [];
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantidade ?? 1), 0);
  const title = String(quote.titulo ?? 'Orçamento');
  return <article className={`client-card quote-card${selected ? ' selected' : ''}`}>
    <div className="quote-card-heading">
      <button type="button" className="quote-title-button" onClick={onSelect} aria-expanded={selected}>
        <span className="quote-card-icon"><Icon icon="mdi:file-document-outline" width={23} height={23} /></span>
        <span className="quote-title-copy"><strong title={title}>{title}</strong><span>{clientName(quote)}</span></span>
      </button>
      <span className={`quote-status ${status}`}><span />{statusLabel(status)}</span>
    </div>
    <div className="quote-card-highlights">
      <div><span>Valor total</span><strong>{currency(quote.valor_total)}</strong></div>
      <div><span>Data do orçamento</span><strong>{date(quote.data_orcamento ?? quote.created_at)}</strong></div>
    </div>
    <div className="quote-card-meta"><span><Icon icon="mdi:package-variant-closed" width={17} height={17} />{itemCount} {itemCount === 1 ? 'unidade' : 'unidades'} em {items.length || Number(quote.itens_count ?? 0)} {items.length === 1 ? 'item' : 'itens'}</span></div>
    <footer className="client-card-footer">
      <span className="client-card-actions-label">Ações</span>
      <div className="client-card-actions">
        <EntityActionButton label={selected ? 'Ocultar detalhes' : 'Ver detalhes'} icon={selected ? 'mdi:chevron-up' : 'mdi:eye-outline'} onClick={onSelect} />
        {status === 'pendente' && canApprove && <EntityActionButton label="Aprovar orçamento" icon="mdi:check-circle-outline" onClick={onApprove} />}
        {status === 'pendente' && canEdit && <EntityActionButton label="Editar orçamento" icon="mdi:pencil-outline" onClick={onEdit} />}
        {status === 'pendente' && canDelete && <EntityActionButton label="Excluir orçamento" icon="mdi:trash-can-outline" onClick={onDelete} danger />}
      </div>
    </footer>
    {selected && <div className="client-card-details quote-card-details">
      <p><span>Cliente</span><strong>{clientName(quote)}</strong></p>
      <p><span>Criado em</span><strong>{date(quote.data_orcamento ?? quote.created_at)}</strong></p>
      {quote.aprovador_nome && <p><span>Aprovado por</span><strong>{String(quote.aprovador_nome)}</strong></p>}
      {quote.aprovado_em && <p><span>Data de aprovação</span><strong>{date(quote.aprovado_em)}</strong></p>}
      {items.length > 0 && <div className="quote-items-list"><span>Produtos do orçamento</span>{items.map((item, index) => <div key={String(item.id ?? index)}><strong>{String(item.produto?.nome ?? item.produto_nome ?? 'Produto')} × {Number(item.quantidade ?? 1)}</strong><span>{currency(item.subtotal ?? item.preco_unitario)}</span></div>)}</div>}
    </div>}
  </article>;
}

function QuoteFilters({ search, status, count, onSearch, onStatus }: { search: string; status: string; count: number; onSearch: (value: string) => void; onStatus: (value: string) => void }) {
  return <>
    <EntityDirectoryHeading eyebrow="NEGOCIAÇÃO" title="Todos os orçamentos" description="Busque pelo título ou cliente e filtre pelo status da proposta." count={count} />
    <div className="client-filters quote-filters">
      <label className="search-field"><Icon icon="mdi:magnify" width={20} height={20} /><input type="search" aria-label="Buscar orçamentos ao digitar" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar por título ou cliente" /></label>
      <FormControl fullWidth className="client-type-select-field">
        <InputLabel id="quote-status-label">Status do orçamento</InputLabel>
        <Select labelId="quote-status-label" id="quote-status-select" value={status} label="Status do orçamento" onChange={(event) => onStatus(String(event.target.value))} MenuProps={{ disablePortal: true, slotProps: { paper: { sx: { backgroundColor: 'var(--card)', color: 'var(--ink)' } } } }}>
          <MenuItem value="">Todos os status</MenuItem><MenuItem value="pendente">Pendente</MenuItem><MenuItem value="aprovado">Aprovado</MenuItem><MenuItem value="vendido">Vendido</MenuItem><MenuItem value="cancelado">Cancelado</MenuItem>
        </Select>
      </FormControl>
    </div>
  </>;
}

export function QuotesPage() {
  const { can } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Quote | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canCreate = can('orcamentos.criar');
  const canEdit = can('orcamentos.editar');
  const canDelete = can('orcamentos.excluir');
  const canApprove = canCreate || canEdit || can('orcamentos.aprovar');

  const reload = async () => setQuotes(unwrapList(await apiFetch<unknown>('/orcamentos')));
  useEffect(() => {
    apiFetch<unknown>('/orcamentos')
      .then((payload) => setQuotes(unwrapList(payload)))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os orçamentos.'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!canCreate) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('novo') !== '1') return;
    setEditing(null);
    url.searchParams.delete('novo');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, [canCreate]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return quotes.filter((quote) => {
      const matchesStatus = !status || statusOf(quote) === status;
      const matchesSearch = !term || [quote.titulo, clientName(quote)].some((value) => String(value ?? '').toLocaleLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [quotes, search, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function saveQuote(payload: Quote, id?: string) {
    await apiFetch(id ? `/orcamentos/${id}` : '/orcamentos', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await reload();
  }
  async function deleteQuote(quote: Quote) {
    if (!window.confirm(`Excluir ${String(quote.titulo ?? 'este orçamento')}? Essa ação não pode ser desfeita.`)) return;
    try {
      await apiFetch(`/orcamentos/${quote.id}`, { method: 'DELETE' });
      await reload();
      if (selectedId === String(quote.id)) setSelectedId(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível excluir o orçamento.'); }
  }
  async function approveQuote(quote: Quote) {
    try { await apiFetch(`/orcamentos/${quote.id}/aprovar`, { method: 'PATCH' }); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível aprovar o orçamento.'); }
  }
  function changeFilter(value: string, setter: (value: string) => void) { setter(value); setPage(1); }

  return <div className="clients-page quotes-page">
    <EntityPageHeading eyebrow="VENDAS E NEGOCIAÇÃO" icon="mdi:file-document-outline" title="Orçamentos" description="Crie propostas, acompanhe aprovações e consulte os valores negociados." createLabel="Novo orçamento" canCreate={canCreate} onCreate={() => setEditing(null)} />
    <section className="client-summary-grid quote-summary-grid" aria-label="Resumo de orçamentos">
      <EntitySummaryCard label="Total de orçamentos" value={loading ? '—' : quotes.length} icon="mdi:file-document-multiple-outline" color="#005CE4" />
      <EntitySummaryCard label="Pendentes" value={loading ? '—' : quotes.filter((quote) => statusOf(quote) === 'pendente').length} icon="mdi:clock-outline" color="#e78a12" />
      <EntitySummaryCard label="Aprovados" value={loading ? '—' : quotes.filter((quote) => statusOf(quote) === 'aprovado').length} icon="mdi:check-circle-outline" color="#0f9f73" />
      <EntitySummaryCard label="Convertidos em venda" value={loading ? '—' : quotes.filter((quote) => statusOf(quote) === 'vendido').length} icon="mdi:cash-check" color="#8b5cf6" />
    </section>
    <section className="client-directory">
      <QuoteFilters search={search} status={status} count={filtered.length} onSearch={(value) => changeFilter(value, setSearch)} onStatus={(value) => changeFilter(value, setStatus)} />
      {error && <div className="inline-error">{error}</div>}
      {loading ? <div className="table-loading"><span className="spinner" />Carregando orçamentos…</div> : pageItems.length ? <div className="client-card-grid">{pageItems.map((quote) => <QuoteCard key={String(quote.id)} quote={quote} selected={selectedId === String(quote.id)} canEdit={canEdit} canDelete={canDelete} canApprove={canApprove} onSelect={() => setSelectedId(selectedId === String(quote.id) ? null : String(quote.id))} onEdit={() => setEditing(quote)} onDelete={() => void deleteQuote(quote)} onApprove={() => void approveQuote(quote)} />)}</div> : <div className="empty-state compact"><span className="empty-icon"><Icon icon="mdi:file-document-outline" /></span><h2>{search || status ? 'Nenhum orçamento encontrado' : 'Ainda não há orçamentos'}</h2><p>{search || status ? 'Ajuste a busca ou o status para ver outras propostas.' : 'Crie o primeiro orçamento para registrar uma proposta comercial.'}</p></div>}
      {!loading && <EntityPagination noun="orçamentos" page={currentPage} totalPages={totalPages} total={filtered.length} from={(currentPage - 1) * PAGE_SIZE + 1} to={Math.min(currentPage * PAGE_SIZE, filtered.length)} onChange={setPage} />}
    </section>
    {editing !== undefined && <RecordEditor module="orcamentos" row={editing} onClose={() => setEditing(undefined)} onSave={saveQuote} />}
  </div>;
}

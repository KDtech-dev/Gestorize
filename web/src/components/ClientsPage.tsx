'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RecordEditor } from '@/components/RecordEditor';
import { UserAvatar } from '@/components/UserAvatar';
import { EntityActionButton, EntityDirectoryHeading, EntityPageHeading, EntityPagination, EntitySummaryCard } from '@/components/entities/EntityPageParts';

type Client = Record<string, any>;
const PAGE_SIZE = 9;

function unwrapList(payload: unknown): Client[] {
  let current = payload as { data?: unknown };
  for (let i = 0; i < 4 && current && !Array.isArray(current); i++) current = current.data as typeof current;
  return Array.isArray(current) ? current as Client[] : [];
}

function clientType(client: Client) {
  return String(client.tipo ?? '').toLowerCase() === 'pj' ? 'Pessoa jurídica' : 'Pessoa física';
}

function clientIcon(client: Client) {
  return String(client.tipo ?? '').toLowerCase() === 'pj' ? 'mdi:domain' : 'mdi:account-outline';
}

function clientDocument(client: Client) {
  const business = String(client.tipo ?? '').toLowerCase() === 'pj';
  const raw = String(business ? client.pj?.cnpj ?? '' : client.pf?.cpf ?? '');
  const digits = raw.replace(/\D/g, '');
  if (!business && digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (business && digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return raw || (business ? 'CNPJ não informado' : 'CPF não informado');
}

function ClientCard({ client, selected, onSelect, onEdit, onDelete }: { client: Client; selected: boolean; onSelect: () => void; onEdit: () => void; onDelete: () => void }) {
  const identity = String(client.nome ?? 'Cliente');
  return <article className={`client-card${selected ? ' selected' : ''}`}>
    <div className="client-card-top">
      <button type="button" className="client-card-identity" onClick={onSelect} aria-expanded={selected}>
        <UserAvatar name={identity} imageUrl={client.avatar_url ?? client.avatar} fallbackIcon={clientIcon(client)} size={58} className="client-card-avatar" />
        <span className="client-card-identity-copy"><strong title={identity}>{identity}</strong><span>{clientDocument(client)}</span></span>
      </button>
      <span className={`client-kind${String(client.tipo).toLowerCase() === 'pj' ? ' business' : ''}`}>{clientType(client)}</span>
    </div>
    <div className="client-card-contact">
      <span><Icon icon="mdi:email-outline" width={17} height={17} /><span title={client.email ?? ''}>{client.email || 'E-mail não informado'}</span></span>
      <span><Icon icon="mdi:phone-outline" width={17} height={17} /><span>{client.telefone || 'Telefone não informado'}</span></span>
    </div>
    <footer className="client-card-footer">
      <span className="client-card-actions-label">Ações</span>
      <div className="client-card-actions">
        <EntityActionButton label={selected ? 'Ocultar detalhes' : 'Ver detalhes'} icon={selected ? 'mdi:chevron-up' : 'mdi:eye-outline'} onClick={onSelect} />
        <EntityActionButton label="Editar cliente" icon="mdi:pencil-outline" onClick={onEdit} />
        <EntityActionButton label="Excluir cliente" icon="mdi:trash-can-outline" onClick={onDelete} danger />
      </div>
    </footer>
    {selected && <div className="client-card-details">
      {String(client.tipo).toLowerCase() === 'pj' ? <>
        <p><span>Razão social</span><strong>{client.pj?.razao_social || '—'}</strong></p>
        <p><span>CNPJ</span><strong>{client.pj?.cnpj || '—'}</strong></p>
        <p><span>Responsável</span><strong>{client.pj?.nome_responsavel || '—'}</strong></p>
      </> : <>
        <p><span>CPF</span><strong>{client.pf?.cpf || '—'}</strong></p>
        <p><span>RG</span><strong>{client.pf?.rg || '—'}</strong></p>
        <p><span>Nascimento</span><strong>{client.pf?.data_nascimento ? new Date(`${client.pf.data_nascimento}T00:00:00`).toLocaleDateString('pt-BR') : '—'}</strong></p>
      </>}
      <p><span>Cidade</span><strong>{[client.endereco?.cidade, client.endereco?.estado].filter(Boolean).join(' / ') || '—'}</strong></p>
    </div>}
  </article>;
}

function ClientFilters({ search, type, count, onSearch, onType }: { search: string; type: string; count: number; onSearch: (value: string) => void; onType: (value: string) => void }) {
  return <>
    <EntityDirectoryHeading eyebrow="CADASTRO" title="Todos os clientes" description="Use a busca ou filtre pelo tipo para localizar um cadastro." count={count} />
    <div className="client-filters">
      <label className="search-field"><Icon icon="mdi:magnify" width={20} height={20} /><input type="search" aria-label="Buscar clientes ao digitar" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar por nome, documento, e-mail ou telefone" /></label>
      <FormControl fullWidth className="client-type-select-field">
        <InputLabel id="client-type-label">Tipo de cliente</InputLabel>
        <Select labelId="client-type-label" id="client-type-select" value={type} label="Tipo de cliente" onChange={(event) => onType(String(event.target.value))} MenuProps={{ disablePortal: true, slotProps: { paper: { sx: { backgroundColor: 'var(--card)', color: 'var(--ink)' } } } }}>
          <MenuItem value="">Todos os tipos</MenuItem>
          <MenuItem value="pf">Pessoa física</MenuItem>
          <MenuItem value="pj">Pessoa jurídica</MenuItem>
        </Select>
      </FormControl>
    </div>
  </>;
}

export function ClientsPage() {
  const { can } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Client | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = async () => setClients(unwrapList(await apiFetch<unknown>('/clientes')));
  useEffect(() => {
    apiFetch<unknown>('/clientes')
      .then((payload) => setClients(unwrapList(payload)))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os clientes.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!can('clientes.criar')) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('novo') !== '1') return;
    setEditing(null);
    url.searchParams.delete('novo');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, [can]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return clients.filter((client) => {
      const matchesType = !type || String(client.tipo ?? 'pf').toLowerCase() === type;
      const nested = [client.pf?.cpf, client.pf?.rg, client.pj?.cnpj, client.pj?.razao_social, client.pj?.nome_fantasia].filter(Boolean).join(' ');
      const matchesSearch = !term || [client.nome, client.email, client.telefone, nested].some((value) => String(value ?? '').toLocaleLowerCase().includes(term));
      return matchesType && matchesSearch;
    });
  }, [clients, search, type]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const physical = clients.filter((client) => String(client.tipo ?? '').toLowerCase() !== 'pj').length;
  const business = clients.length - physical;

  async function saveClient(payload: Client, id?: string) {
    await apiFetch(id ? `/clientes/${id}` : '/clientes', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await reload();
  }

  async function deleteClient(client: Client) {
    if (!window.confirm(`Excluir ${String(client.nome ?? 'este cliente')}? Essa ação não pode ser desfeita.`)) return;
    try {
      await apiFetch(`/clientes/${client.id}`, { method: 'DELETE' });
      await reload();
      if (selectedId === client.id) setSelectedId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível excluir o cliente.');
    }
  }

  function changeFilter(value: string, setValue: (value: string) => void) {
    setValue(value);
    setPage(1);
  }

  return <div className="clients-page">
    <EntityPageHeading eyebrow="RELACIONAMENTO" icon="mdi:account-group-outline" title="Clientes" description="Consulte e organize as pessoas físicas e jurídicas da sua organização." createLabel="Novo cliente" canCreate={can('clientes.criar')} onCreate={() => setEditing(null)} />

    <section className="client-summary-grid" aria-label="Resumo de clientes">
      <EntitySummaryCard label="Total de clientes" value={loading ? '—' : clients.length} icon="mdi:account-group-outline" color="#005CE4" />
      <EntitySummaryCard label="Pessoas físicas" value={loading ? '—' : physical} icon="mdi:account-outline" color="#0f9f73" />
      <EntitySummaryCard label="Pessoas jurídicas" value={loading ? '—' : business} icon="mdi:domain" color="#8b5cf6" />
    </section>

    <section className="client-directory">
      <ClientFilters search={search} type={type} count={filtered.length} onSearch={(value) => changeFilter(value, setSearch)} onType={(value) => changeFilter(value, setType)} />
      {error && <div className="inline-error">{error}</div>}
      {loading ? <div className="table-loading"><span className="spinner" />Carregando clientes…</div> : pageItems.length ? <div className="client-card-grid">{pageItems.map((client) => <ClientCard key={String(client.id)} client={client} selected={selectedId === client.id} onSelect={() => setSelectedId(selectedId === client.id ? null : String(client.id))} onEdit={() => setEditing(client)} onDelete={() => void deleteClient(client)} />)}</div> : <div className="empty-state compact"><span className="empty-icon"><Icon icon="mdi:account-search-outline" /></span><h2>{search || type ? 'Nenhum cliente encontrado' : 'Ainda não há clientes'}</h2><p>{search || type ? 'Ajuste os filtros para ver outros cadastros.' : 'Cadastre o primeiro cliente para começar.'}</p></div>}
      {!loading && <EntityPagination noun="clientes" page={currentPage} totalPages={totalPages} total={filtered.length} from={(currentPage - 1) * PAGE_SIZE + 1} to={Math.min(currentPage * PAGE_SIZE, filtered.length)} onChange={setPage} />}
    </section>
    {editing !== undefined && <RecordEditor module="clientes" row={editing} onClose={() => setEditing(undefined)} onSave={saveClient} />}
  </div>;
}

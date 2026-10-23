'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RecordEditor } from '@/components/RecordEditor';
import { UserAvatar } from '@/components/UserAvatar';

type Employee = Record<string, any>;
const PAGE_SIZE = 9;

function unwrapList(payload: unknown): Employee[] {
  let current = payload as Employee;
  for (let i = 0; i < 5 && current && !Array.isArray(current); i++) current = current.data;
  return Array.isArray(current) ? current : [];
}

function lastPageOf(payload: unknown) {
  let current = payload as Employee;
  for (let i = 0; i < 5 && current && !Array.isArray(current); i++) {
    const lastPage = Number(current.meta?.last_page);
    if (Number.isFinite(lastPage) && lastPage > 0) return lastPage;
    current = current.data;
  }
  return 1;
}

async function fetchEmployees(): Promise<Employee[]> {
  const first = await apiFetch<unknown>('/funcionarios?page=1');
  const employees = unwrapList(first);
  const lastPage = lastPageOf(first);
  for (let page = 2; page <= lastPage; page++) employees.push(...unwrapList(await apiFetch<unknown>(`/funcionarios?page=${page}`)));
  return employees;
}

function cpf(value: unknown) {
  const raw = String(value ?? '');
  const digits = raw.replace(/\D/g, '');
  return digits.length === 11 ? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : raw || 'CPF não informado';
}

function roleOf(employee: Employee) { return String(employee.role ?? 'funcionario').toLocaleLowerCase(); }
function roleLabel(role: string) { return role === 'gestor' ? 'Gestor' : role === 'admin' ? 'Administrador' : 'Funcionário'; }
function date(value: unknown) {
  if (!value) return '—';
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('pt-BR');
}

function EmployeeSummary({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return <article className="client-summary-card" style={{ '--summary-color': color } as CSSProperties}>
    <span className="client-summary-icon"><Icon icon={icon} width={22} height={22} /></span><span className="client-summary-label">{label}</span><strong>{value}</strong>
  </article>;
}

function EmployeeAction({ label, icon, onClick, danger = false }: { label: string; icon: string; onClick: () => void; danger?: boolean }) {
  return <button type="button" className={`client-action${danger ? ' danger' : ''}`} aria-label={label} data-tooltip={label} onClick={(event) => { event.stopPropagation(); onClick(); }}><Icon icon={icon} width={19} height={19} /></button>;
}

function EmployeeCard({ employee, selected, isSelf, canEdit, canDelete, onSelect, onEdit, onDelete }: {
  employee: Employee; selected: boolean; isSelf: boolean; canEdit: boolean; canDelete: boolean;
  onSelect: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const name = String(employee.nome ?? 'Funcionário');
  const role = roleOf(employee);
  const directPermissions = Array.isArray(employee.permissions) ? employee.permissions as string[] : [];
  const rolePermissions = Array.isArray(employee.role_permissions) ? employee.role_permissions as string[] : [];
  return <article className={`client-card employee-card${selected ? ' selected' : ''}`}>
    <div className="client-card-top employee-card-top">
      <button type="button" className="client-card-identity" onClick={onSelect} aria-expanded={selected}>
        <UserAvatar name={name} imageUrl={employee.avatar_url ?? employee.avatar} fallbackIcon="mdi:account-outline" size={58} className="client-card-avatar employee-card-avatar" />
        <span className="client-card-identity-copy"><strong title={name}>{name}</strong><span>{cpf(employee.cpf)}</span></span>
      </button>
      <span className={`employee-role ${role}`}><Icon icon={role === 'gestor' ? 'mdi:account-tie-outline' : 'mdi:account-outline'} width={16} height={16} />{roleLabel(role)}</span>
    </div>
    <div className="client-card-contact employee-card-contact">
      <span><Icon icon="mdi:email-outline" width={17} height={17} /><span title={employee.email ?? ''}>{employee.email || 'E-mail não informado'}</span></span>
      <span><Icon icon="mdi:phone-outline" width={17} height={17} /><span>{employee.telefone || 'Telefone não informado'}</span></span>
    </div>
    <footer className="client-card-footer">
      <span className="client-card-actions-label">Ações</span>
      <div className="client-card-actions">
        <EmployeeAction label={selected ? 'Ocultar detalhes' : 'Ver detalhes'} icon={selected ? 'mdi:chevron-up' : 'mdi:eye-outline'} onClick={onSelect} />
        {canEdit && <EmployeeAction label="Editar funcionário" icon="mdi:pencil-outline" onClick={onEdit} />}
        {canDelete && !isSelf && <EmployeeAction label="Excluir funcionário" icon="mdi:trash-can-outline" onClick={onDelete} danger />}
      </div>
    </footer>
    {selected && <div className="client-card-details employee-card-details">
      <p><span>Perfil de acesso</span><strong>{roleLabel(role)}</strong></p>
      <p><span>Data de nascimento</span><strong>{date(employee.data_nascimento)}</strong></p>
      <p><span>Permissões do perfil</span><strong>{rolePermissions.length}</strong></p>
      <p><span>Permissões individuais</span><strong>{directPermissions.length}</strong></p>
      {directPermissions.length > 0 && <div className="employee-permission-list"><span>Permissões individuais concedidas</span><strong>{directPermissions.join(', ')}</strong></div>}
      {employee.endereco && <p><span>Endereço</span><strong>{[employee.endereco.logradouro, employee.endereco.numero, employee.endereco.cidade, employee.endereco.estado].filter(Boolean).join(', ') || '—'}</strong></p>}
    </div>}
  </article>;
}

function EmployeesHeading({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return <header className="clients-page-heading">
    <div className="clients-heading-content"><span className="eyebrow"><Icon icon="mdi:account-cog-outline" width={19} height={19} /><span>EQUIPE E ACESSOS</span></span><h1>Funcionários</h1><p>Gerencie os membros da organização, seus perfis e permissões individuais.</p></div>
    <div className="clients-heading-actions">{canCreate && <button className="primary-button" onClick={onCreate}><Icon icon="mdi:account-plus-outline" width={20} height={20} />Novo funcionário</button>}</div>
  </header>;
}

function EmployeeFilters({ search, role, count, onSearch, onRole }: { search: string; role: string; count: number; onSearch: (value: string) => void; onRole: (value: string) => void }) {
  return <>
    <header className="client-directory-heading"><div><span className="eyebrow">CADASTRO</span><h2>Equipe da organização</h2><p>Busque por nome, documento ou contato e filtre pelo perfil de acesso.</p></div><span className="client-results-count">{count} resultado{count === 1 ? '' : 's'}</span></header>
    <div className="client-filters employee-filters">
      <label className="search-field"><Icon icon="mdi:magnify" width={20} height={20} /><input type="search" aria-label="Buscar funcionários ao digitar" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar por nome, CPF, e-mail ou telefone" /></label>
      <FormControl fullWidth className="client-type-select-field">
        <InputLabel id="employee-role-label">Perfil de acesso</InputLabel>
        <Select labelId="employee-role-label" id="employee-role-select" value={role} label="Perfil de acesso" onChange={(event) => onRole(String(event.target.value))} MenuProps={{ disablePortal: true, slotProps: { paper: { sx: { backgroundColor: 'var(--card)', color: 'var(--ink)' } } } }}>
          <MenuItem value="">Todos os perfis</MenuItem><MenuItem value="gestor">Gestores</MenuItem><MenuItem value="funcionario">Funcionários</MenuItem>
        </Select>
      </FormControl>
    </div>
  </>;
}

function EmployeePagination({ page, totalPages, total, from, to, onChange }: { page: number; totalPages: number; total: number; from: number; to: number; onChange: (page: number) => void }) {
  if (!total) return null;
  return <nav className="client-pagination" aria-label="Paginação de funcionários">
    <span>Exibindo <strong>{from}–{to}</strong> de <strong>{total}</strong> funcionários</span>
    <div><button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Página anterior" title="Página anterior"><Icon icon="mdi:chevron-left" width={20} height={20} /></button><span>Página <strong>{page}</strong> de <strong>{totalPages}</strong></span><button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Próxima página" title="Próxima página"><Icon icon="mdi:chevron-right" width={20} height={20} /></button></div>
  </nav>;
}

export function EmployeesPage() {
  const { can, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Employee | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canCreate = can('users.criar');
  const canEdit = can('users.editar');
  const canDelete = can('users.excluir');

  const reload = async () => setEmployees(await fetchEmployees());
  useEffect(() => {
    fetchEmployees()
      .then(setEmployees)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os funcionários.'))
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
    return employees.filter((employee) => {
      const matchesRole = !role || roleOf(employee) === role;
      const matchesSearch = !term || [employee.nome, employee.cpf, employee.email, employee.telefone].some((value) => String(value ?? '').toLocaleLowerCase().includes(term));
      return matchesRole && matchesSearch;
    });
  }, [employees, role, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function saveEmployee(payload: Employee, id?: string) {
    await apiFetch(id ? `/funcionarios/${id}` : '/funcionarios', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await reload();
  }
  async function deleteEmployee(employee: Employee) {
    if (!window.confirm(`Excluir ${String(employee.nome ?? 'este funcionário')}? Essa ação não pode ser desfeita.`)) return;
    try {
      await apiFetch(`/funcionarios/${employee.id}`, { method: 'DELETE' });
      await reload();
      if (selectedId === String(employee.id)) setSelectedId(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível excluir o funcionário.'); }
  }
  function changeFilter(value: string, setter: (value: string) => void) { setter(value); setPage(1); }

  const managers = employees.filter((employee) => roleOf(employee) === 'gestor').length;
  const withIndividualPermissions = employees.filter((employee) => Array.isArray(employee.permissions) && employee.permissions.length > 0).length;
  return <div className="clients-page employees-page">
    <EmployeesHeading canCreate={canCreate} onCreate={() => setEditing(null)} />
    <section className="client-summary-grid employee-summary-grid" aria-label="Resumo da equipe">
      <EmployeeSummary label="Total de funcionários" value={loading ? '—' : employees.length} icon="mdi:account-group-outline" color="#005CE4" />
      <EmployeeSummary label="Gestores" value={loading ? '—' : managers} icon="mdi:account-tie-outline" color="#8b5cf6" />
      <EmployeeSummary label="Com permissões individuais" value={loading ? '—' : withIndividualPermissions} icon="mdi:shield-account-outline" color="#0f9f73" />
    </section>
    <section className="client-directory">
      <EmployeeFilters search={search} role={role} count={filtered.length} onSearch={(value) => changeFilter(value, setSearch)} onRole={(value) => changeFilter(value, setRole)} />
      {error && <div className="inline-error">{error}</div>}
      {loading ? <div className="table-loading"><span className="spinner" />Carregando funcionários…</div> : pageItems.length ? <div className="client-card-grid">{pageItems.map((employee) => <EmployeeCard key={String(employee.id)} employee={employee} selected={selectedId === String(employee.id)} isSelf={String(employee.id) === String(user?.id)} canEdit={canEdit} canDelete={canDelete} onSelect={() => setSelectedId(selectedId === String(employee.id) ? null : String(employee.id))} onEdit={() => setEditing(employee)} onDelete={() => void deleteEmployee(employee)} />)}</div> : <div className="empty-state compact"><span className="empty-icon"><Icon icon="mdi:account-search-outline" /></span><h2>{search || role ? 'Nenhum funcionário encontrado' : 'Ainda não há funcionários'}</h2><p>{search || role ? 'Ajuste a busca ou o perfil para ver outros cadastros.' : 'Cadastre o primeiro funcionário para começar.'}</p></div>}
      {!loading && <EmployeePagination page={currentPage} totalPages={totalPages} total={filtered.length} from={(currentPage - 1) * PAGE_SIZE + 1} to={Math.min(currentPage * PAGE_SIZE, filtered.length)} onChange={setPage} />}
    </section>
    {editing !== undefined && <RecordEditor module="funcionarios" row={editing} onClose={() => setEditing(undefined)} onSave={saveEmployee} />}
  </div>;
}

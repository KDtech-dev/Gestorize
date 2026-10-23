'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RecordEditor } from '@/components/RecordEditor';

type Row = Record<string, unknown>;
const definitions: Record<string, { columns: Array<{ key: string; label: string; format?: (row: Row) => string }>; search: string[] }> = {
  clientes: { columns: [{ key: 'nome', label: 'Cliente' }, { key: 'tipo', label: 'Tipo' }, { key: 'email', label: 'E-mail' }, { key: 'telefone', label: 'Telefone' }], search: ['nome', 'email', 'telefone'] },
  produtos: { columns: [{ key: 'nome', label: 'Produto' }, { key: 'codigo_barras', label: 'Código' }, { key: 'categoria_titulo', label: 'Categoria' }, { key: 'preco_venda', label: 'Preço', format: (row) => currency(row.preco_venda) }, { key: 'estoque', label: 'Estoque' }], search: ['nome', 'codigo_barras', 'categoria_titulo'] },
  fornecedores: { columns: [{ key: 'nome', label: 'Fornecedor' }, { key: 'categorias', label: 'Ramos de atividade', format: (row) => Array.isArray(row.categorias) ? (row.categorias as Row[]).map((category) => String(category.nome ?? '')).join(', ') || '—' : '—' }, { key: 'email', label: 'E-mail' }, { key: 'telefone', label: 'Telefone' }, { key: 'cnpj', label: 'CNPJ' }], search: ['nome', 'razao_social', 'email', 'cnpj'] },
  orcamentos: { columns: [{ key: 'titulo', label: 'Orçamento' }, { key: 'cliente_nome', label: 'Cliente', format: (row) => String(row.cliente_nome ?? (row.cliente as Row | undefined)?.nome ?? '—') }, { key: 'status', label: 'Status', format: (row) => String(row.status ?? 'Pendente') }, { key: 'data_orcamento', label: 'Criado em', format: (row) => date(row.data_orcamento ?? row.created_at) }, { key: 'valor_total', label: 'Valor', format: (row) => currency(row.valor_total) }], search: ['titulo', 'status'] },
  funcionarios: { columns: [{ key: 'nome', label: 'Funcionário' }, { key: 'email', label: 'E-mail' }, { key: 'telefone', label: 'Telefone' }, { key: 'role', label: 'Perfil' }], search: ['nome', 'email', 'cpf'] },
};

function currency(value: unknown) { const number = Number(value ?? 0); return Number.isFinite(number) ? number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'; }
function date(value: unknown) { if (!value) return '—'; const parsed = new Date(String(value)); return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('pt-BR'); }
function rowsFrom(payload: unknown): Row[] {
  let current = payload as { data?: unknown };
  for (let i = 0; i < 3 && current && !Array.isArray(current); i++) current = current.data as typeof current;
  return Array.isArray(current) ? current as Row[] : [];
}

function facetLabel(row: Row, module: string): string {
  if (module === 'clientes') return String(row.tipo ?? '').toLowerCase() === 'pj' ? 'Pessoa jurídica' : 'Pessoa física';
  if (module === 'produtos') return String(row.categoria_titulo ?? (row.categoria as Row | undefined)?.nome ?? 'Sem categoria');
  if (module === 'fornecedores') return Array.isArray(row.categorias) ? String((row.categorias as Row[])[0]?.nome ?? 'Sem categoria') : 'Sem categoria';
  if (module === 'orcamentos') return String(row.status ?? 'pendente').toLowerCase();
  if (module === 'funcionarios') return String(row.role ?? 'funcionário').toLowerCase();
  return '';
}

const facetTitles: Record<string, string> = { clientes: 'Tipo de cliente', produtos: 'Categoria', fornecedores: 'Ramo de atividade', orcamentos: 'Status', funcionarios: 'Perfil' };
const prettyLabel = (key: string) => key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toLocaleUpperCase());

export function DataModule({ title, endpoint, module }: { title: string; endpoint: string; module: string }) {
  const { can } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [facet, setFacet] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);
  const definition = definitions[module];

  const permissionResource = module === 'funcionarios' ? 'users' : module;
  const canCreate = can(`${permissionResource}.criar`);
  const canEdit = can(`${permissionResource}.editar`);
  const canDelete = can(`${permissionResource}.excluir`);

  const reload = async () => setRows(rowsFrom(await apiFetch<unknown>(endpoint)));

  useEffect(() => {
    apiFetch<unknown>(endpoint)
      .then((payload) => setRows(rowsFrom(payload)))
      .catch((reason) => setError(reason instanceof Error ? reason.message : `Não foi possível carregar ${title.toLowerCase()}.`))
      .finally(() => setLoading(false));
  }, [endpoint, title]);

  useEffect(() => {
    if (!canCreate) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('novo') !== '1') return;
    setEditing(null);
    url.searchParams.delete('novo');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, [canCreate]);

  const facetValues = useMemo(() => [...new Set(rows.flatMap((row) => module === 'fornecedores' && Array.isArray(row.categorias) ? (row.categorias as Row[]).map((category) => String(category.nome ?? '')).filter(Boolean) : [facetLabel(row, module)]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [module, rows]);
  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesSearch = definition.search.some((key) => String(row[key] ?? '').toLocaleLowerCase().includes(search.toLocaleLowerCase())) || (module === 'fornecedores' && Array.isArray(row.categorias) && (row.categorias as Row[]).some((category) => String(category.nome ?? '').toLocaleLowerCase().includes(search.toLocaleLowerCase())));
    const matchesFacet = !facet || (module === 'fornecedores' && Array.isArray(row.categorias) ? (row.categorias as Row[]).some((category) => String(category.nome ?? '') === facet) : facetLabel(row, module) === facet);
    return matchesSearch && matchesFacet;
  }), [definition, facet, module, rows, search]);
  const moduleMetrics = useMemo(() => {
    if (module === 'produtos') return [
      { label: 'Com estoque', value: rows.filter((row) => Number(row.estoque) > 0).length },
      { label: 'Estoque zerado', value: rows.filter((row) => Number(row.estoque) <= 0).length },
      { label: 'Categorias', value: facetValues.length },
    ];
    if (module === 'clientes') return [
      { label: 'Pessoas físicas', value: rows.filter((row) => String(row.tipo).toLowerCase() !== 'pj').length },
      { label: 'Pessoas jurídicas', value: rows.filter((row) => String(row.tipo).toLowerCase() === 'pj').length },
      { label: 'Com e-mail', value: rows.filter((row) => !!row.email).length },
    ];
    if (module === 'fornecedores') return [
      { label: 'Com e-mail', value: rows.filter((row) => !!row.email).length },
      { label: 'Ramos cadastrados', value: facetValues.length },
      { label: 'Com telefone', value: rows.filter((row) => !!row.telefone).length },
    ];
    if (module === 'funcionarios') return [
      { label: 'Gestores', value: rows.filter((row) => String(row.role).toLowerCase() === 'gestor').length },
      { label: 'Funcionários', value: rows.filter((row) => String(row.role).toLowerCase() !== 'gestor').length },
      { label: 'Com e-mail', value: rows.filter((row) => !!row.email).length },
    ];
    if (module === 'orcamentos') return [
      { label: 'Pendentes', value: rows.filter((row) => String(row.status).toLowerCase() === 'pendente').length },
      { label: 'Aprovados', value: rows.filter((row) => String(row.status).toLowerCase() === 'aprovado').length },
      { label: 'Vendidos', value: rows.filter((row) => String(row.status).toLowerCase() === 'vendido').length },
    ];
    return [];
  }, [facetValues.length, module, rows]);
  async function saveRecord(payload: Row, id?: string) {
    await apiFetch(id ? `${endpoint}/${id}` : endpoint, { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    await reload();
  }
  async function removeRecord(row: Row) {
    if (!window.confirm(`Excluir ${String(row.nome ?? row.titulo ?? 'este registro')}? Essa ação não pode ser desfeita.`)) return;
    try { await apiFetch(`${endpoint}/${row.id}`, { method: 'DELETE' }); await reload(); if (selected?.id === row.id) setSelected(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível excluir o registro.'); }
  }
  async function approveBudget(row: Row) {
    try { await apiFetch(`${endpoint}/${row.id}/aprovar`, { method: 'PATCH' }); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível aprovar o orçamento.'); }
  }
  return <>
    <div className="page-heading"><div><span className="eyebrow">GESTÃO DE CADASTROS</span><h1>{title}</h1><p>Pesquise, filtre e consulte os dados completos dos registros.</p></div><div className="heading-actions">{canCreate && <button className="primary-button" onClick={() => setEditing(null)}>+ Novo cadastro</button>}<div className="record-count"><strong>{loading ? '—' : rows.length}</strong><span>registros</span></div></div></div>
    {!!moduleMetrics.length && <section className="module-metrics">{moduleMetrics.map((metric) => <article className="module-metric" key={metric.label}><span>{metric.label}</span><strong>{loading ? '—' : metric.value}</strong></article>)}</section>}
    <section className="data-panel">
      <div className="table-toolbar"><label className="search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${title.toLocaleLowerCase()}...`} /></label><div className="table-toolbar-actions">{facetValues.length > 1 && <label className="facet-field"><span>{facetTitles[module]}</span><select value={facet} onChange={(event) => setFacet(event.target.value)}><option value="">Todos</option>{facetValues.map((value) => <option key={value} value={value}>{prettyLabel(value)}</option>)}</select></label>}<span className="table-count">{filteredRows.length} de {rows.length} registros</span></div></div>
      {error && <div className="inline-error">{error}</div>}
      {loading ? <div className="table-loading"><span className="spinner" />Carregando registros…</div> : filteredRows.length === 0 ? <div className="empty-state compact"><span className="empty-icon">⌕</span><h2>{search ? 'Nenhum resultado encontrado' : 'Ainda não há registros'}</h2><p>{search ? 'Tente buscar por outro termo.' : 'Os dados cadastrados no mobile aparecerão aqui.'}</p></div> : <div className="table-scroll"><table><thead><tr>{definition.columns.map((column) => <th key={column.key}>{column.label}</th>)}<th> </th></tr></thead><tbody>
        {filteredRows.map((row, index) => <tr key={String(row.id ?? index)} onClick={() => setSelected(selected?.id === row.id ? null : row)} className={selected?.id === row.id ? 'row-selected' : ''}>
          {definition.columns.map((column) => <td key={column.key}>{column.key === 'status' ? <span className={`status-pill ${String(row.status ?? 'pendente').toLowerCase()}`}>{column.format?.(row) ?? String(row[column.key] ?? '—')}</span> : column.format?.(row) ?? String(row[column.key] ?? '—')}</td>)}<td className="table-actions" onClick={(event) => event.stopPropagation()}>
            {module === 'orcamentos' && row.status === 'pendente' && (can('orcamentos.criar') || can('orcamentos.editar') || can('orcamentos.aprovar')) && <button className="small-action approve-action" onClick={() => void approveBudget(row)}>Aprovar</button>}
            {canEdit && !(module === 'orcamentos' && ['aprovado', 'vendido'].includes(String(row.status))) && <button className="small-action" onClick={() => setEditing(row)}>Editar</button>}
            {canDelete && !(module === 'orcamentos' && ['aprovado', 'vendido'].includes(String(row.status))) && <button className="small-action delete-action" onClick={() => void removeRecord(row)}>Excluir</button>}
            <button className="row-action" aria-label="Ver detalhes" onClick={() => setSelected(selected?.id === row.id ? null : row)}>{selected?.id === row.id ? '⌃' : '⌄'}</button>
          </td>
        </tr>)}
      </tbody></table>
      {selected && <div className="detail-drawer"><div className="detail-title"><span className="eyebrow">DETALHES DO CADASTRO</span><strong>{String(selected.nome ?? selected.name ?? selected.titulo ?? 'Registro')}</strong></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Fechar detalhes">×</button><div className="detail-grid">{Object.entries(selected).filter(([key, value]) => !['id', 'imagens', 'itens', 'endereco', 'pf', 'pj', 'categorias', 'categoria', 'fornecedor', 'cliente', 'unidade_medida'].includes(key) && (typeof value !== 'object' || value === null)).map(([key, value]) => <div key={key}><span>{prettyLabel(key)}</span><strong>{key.includes('preco') || key === 'valor_total' ? currency(value) : key.includes('data') || key.includes('_em') ? date(value) : String(value ?? '—')}</strong></div>)}</div>
        {(['pf', 'pj', 'endereco'] as const).map((group) => Boolean(selected[group]) && <section className="detail-subsection" key={group}><h3>{group === 'pf' ? 'Pessoa física' : group === 'pj' ? 'Pessoa jurídica' : 'Endereço'}</h3><div>{Object.entries(selected[group] as Row).map(([key, value]) => <p key={key}><span>{prettyLabel(key)}</span><strong>{String(value ?? '—')}</strong></p>)}</div></section>)}
        {(['categorias', 'categoria', 'fornecedor', 'cliente', 'unidade_medida'] as const).map((key) => {
          const value = selected[key];
          if (!value) return null;
          const display = Array.isArray(value) ? value.map((item) => String((item as Row).nome ?? '')).filter(Boolean).join(', ') : typeof value === 'object' ? String((value as Row).nome ?? (value as Row).titulo ?? '—') : String(value);
          return <div className="detail-relation" key={key}><span>{prettyLabel(key)}</span><strong>{display || '—'}</strong></div>;
        })}
        {Array.isArray(selected.itens) && <div className="detail-items"><h3>Itens</h3>{(selected.itens as Row[]).map((item, index) => <div key={String(item.id ?? index)}><span>{String(item.produto_nome ?? item.produto?.nome ?? 'Produto')} × {String(item.quantidade ?? 1)}</span><strong>{currency(item.subtotal ?? item.preco_unitario)}</strong></div>)}</div>}
      </div>}
      </div>}
    </section>
    {editing !== undefined && <RecordEditor module={module} row={editing} onClose={() => setEditing(undefined)} onSave={saveRecord} />}
  </>;
}

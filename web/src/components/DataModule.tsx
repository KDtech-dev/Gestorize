'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RecordEditor } from '@/components/RecordEditor';

type Row = Record<string, unknown>;
const definitions: Record<string, { columns: Array<{ key: string; label: string; format?: (row: Row) => string }>; search: string[] }> = {
  clientes: { columns: [{ key: 'nome', label: 'Cliente' }, { key: 'tipo', label: 'Tipo' }, { key: 'email', label: 'E-mail' }, { key: 'telefone', label: 'Telefone' }], search: ['nome', 'email', 'telefone'] },
  produtos: { columns: [{ key: 'nome', label: 'Produto' }, { key: 'codigo_barras', label: 'Código' }, { key: 'categoria_titulo', label: 'Categoria' }, { key: 'preco_venda', label: 'Preço', format: (row) => currency(row.preco_venda) }, { key: 'estoque', label: 'Estoque' }], search: ['nome', 'codigo_barras', 'categoria_titulo'] },
  fornecedores: { columns: [{ key: 'nome', label: 'Fornecedor' }, { key: 'email', label: 'E-mail' }, { key: 'telefone', label: 'Telefone' }, { key: 'cnpj', label: 'CNPJ' }], search: ['nome', 'razao_social', 'email', 'cnpj'] },
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

export function DataModule({ title, endpoint, module }: { title: string; endpoint: string; module: string }) {
  const { can } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
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

  const filteredRows = useMemo(() => rows.filter((row) => definition.search.some((key) => String(row[key] ?? '').toLocaleLowerCase().includes(search.toLocaleLowerCase()))), [definition, rows, search]);
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
    <div className="page-heading"><div><span className="eyebrow">CADASTROS</span><h1>{title}</h1><p>Consulte e gerencie os registros sincronizados com o aplicativo Gestorize.</p></div><div className="heading-actions">{canCreate && <button className="primary-button" onClick={() => setEditing(null)}>+ Novo cadastro</button>}<div className="record-count"><strong>{loading ? '—' : rows.length}</strong><span>registros</span></div></div></div>
    <section className="data-panel">
      <div className="table-toolbar"><label className="search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar ${title.toLocaleLowerCase()}...`} /></label><span className="table-count">{filteredRows.length} resultado{filteredRows.length === 1 ? '' : 's'}</span></div>
      {error && <div className="inline-error">{error}</div>}
      {loading ? <div className="table-loading"><span className="spinner" />Carregando dados da API…</div> : filteredRows.length === 0 ? <div className="empty-state compact"><span className="empty-icon">⌕</span><h2>{search ? 'Nenhum resultado encontrado' : 'Ainda não há registros'}</h2><p>{search ? 'Tente buscar por outro termo.' : 'Os dados cadastrados no mobile aparecerão aqui.'}</p></div> : <div className="table-scroll"><table><thead><tr>{definition.columns.map((column) => <th key={column.key}>{column.label}</th>)}<th> </th></tr></thead><tbody>
        {filteredRows.map((row, index) => <tr key={String(row.id ?? index)} onClick={() => setSelected(selected?.id === row.id ? null : row)} className={selected?.id === row.id ? 'row-selected' : ''}>
          {definition.columns.map((column) => <td key={column.key}>{column.key === 'status' ? <span className={`status-pill ${String(row.status ?? 'pendente').toLowerCase()}`}>{column.format?.(row) ?? String(row[column.key] ?? '—')}</span> : column.format?.(row) ?? String(row[column.key] ?? '—')}</td>)}<td className="table-actions" onClick={(event) => event.stopPropagation()}>
            {module === 'orcamentos' && row.status !== 'aprovado' && (can('orcamentos.criar') || can('orcamentos.editar') || can('orcamentos.aprovar')) && <button className="small-action approve-action" onClick={() => void approveBudget(row)}>Aprovar</button>}
            {canEdit && !(module === 'orcamentos' && row.status === 'aprovado') && <button className="small-action" onClick={() => setEditing(row)}>Editar</button>}
            {canDelete && !(module === 'orcamentos' && row.status === 'aprovado') && <button className="small-action delete-action" onClick={() => void removeRecord(row)}>Excluir</button>}
            <button className="row-action" aria-label="Ver detalhes" onClick={() => setSelected(selected?.id === row.id ? null : row)}>{selected?.id === row.id ? '⌃' : '⌄'}</button>
          </td>
        </tr>)}
      </tbody></table>
      {selected && <div className="detail-drawer"><div><span className="eyebrow">DETALHES</span><strong>{String(selected.nome ?? selected.titulo ?? 'Registro')}</strong></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Fechar detalhes">×</button><div className="detail-grid">{Object.entries(selected).filter(([key, value]) => !['id', 'imagens', 'itens', 'endereco', 'pf', 'pj'].includes(key) && (typeof value !== 'object' || value === null)).map(([key, value]) => <div key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{String(value ?? '—')}</strong></div>)}</div>
        {Array.isArray(selected.itens) && <div className="detail-items"><h3>Itens</h3>{(selected.itens as Row[]).map((item, index) => <div key={String(item.id ?? index)}><span>{String(item.produto_nome ?? item.produto?.nome ?? 'Produto')} × {String(item.quantidade ?? 1)}</span><strong>{currency(item.subtotal ?? item.preco_unitario)}</strong></div>)}</div>}
      </div>}
      </div>}
    </section>
    {editing !== undefined && <RecordEditor module={module} row={editing} onClose={() => setEditing(undefined)} onSave={saveRecord} />}
  </>;
}

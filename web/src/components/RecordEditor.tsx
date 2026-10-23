'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { fornecedorSchema, produtoSchema, validadeObrigatoria } from '@/schemas/records';
import { useAuth } from '@/context/AuthContext';

type Row = Record<string, any>;
type Option = { id: string; nome?: string; titulo?: string; sigla?: string };
type PermissionOption = { id: string; nome: string; grupo: string; acao: string };
type Props = { module: string; row: Row | null; onClose: () => void; onSave: (data: Row, id?: string) => Promise<void> };

const blank = (module: string): Row => {
  if (module === 'clientes') return { nome: '', tipo: 'pf', email: '', telefone: '', pf: { genero: '', rg: '', cpf: '', data_nascimento: '' }, pj: { cnpj: '', razao_social: '', nome_fantasia: '', nome_responsavel: '', cpf_responsavel: '', cargo_responsavel: '' }, endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' } };
  if (module === 'fornecedores') return { nome: '', cnpj: '', email: '', telefone: '', categoria_ids: [], nome_responsavel: '', chave_pix: '' };
  if (module === 'produtos') return { nome: '', descricao: '', preco_custo: '', porcentagem_lucro: '', preco_venda: '', estoque: '', data_entrada: new Date().toISOString().slice(0, 10), validade: '', categoria_id: '', fornecedor_id: '', unidade_medida_id: '' };
  if (module === 'funcionarios') return { name: '', email: '', password: '', password_confirmation: '', telefone: '', cpf: '', data_nascimento: '', role: 'funcionario', permissions: [] };
  if (module === 'orcamentos') return { titulo: '', cliente_id: '', itens: [] };
  return {};
};

function initialForm(module: string, row: Row | null): Row {
  const values = { ...blank(module), ...(row ?? {}) };
  const dateOnly = (value: unknown) => value ? String(value).slice(0, 10) : '';
  if (module === 'produtos') {
    values.data_entrada = dateOnly(values.data_entrada);
    values.validade = dateOnly(values.validade);
  }
  if (module === 'fornecedores' && Array.isArray(values.categorias)) {
    values.categoria_ids = values.categorias.map((category: Option) => category.id);
  }
  if (module === 'funcionarios') values.data_nascimento = dateOnly(values.data_nascimento);
  if (module === 'clientes' && values.pf) values.pf = { ...values.pf, data_nascimento: dateOnly(values.pf.data_nascimento) };
  if (module === 'orcamentos' && !Array.isArray(values.itens)) values.itens = [];
  return values;
}

function TextInput({ label, name, value, onChange, type = 'text', required = false }: { label: string; name: string; value: unknown; onChange: (name: string, value: string) => void; type?: string; required?: boolean }) {
  return <label className="editor-field"><span>{label}</span><input name={name} type={type} value={String(value ?? '')} onChange={(event) => onChange(name, event.target.value)} required={required} /></label>;
}

export function RecordEditor({ module, row, onClose, onSave }: Props) {
  const { can, user } = useAuth();
  const isSelf = module === 'funcionarios' && !!row?.id && String(row.id) === String(user?.id);
  const canManageAccess = module === 'funcionarios' && can('acessos.gerenciar') && !isSelf;
  const [form, setForm] = useState<Row>(() => initialForm(module, row));
  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [permissionOptions, setPermissionOptions] = useState<PermissionOption[]>([]);
  const [inheritedPermissions, setInheritedPermissions] = useState<string[]>(row?.role_permissions ?? []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const edit = !!row;

  useEffect(() => {
    let active = true;
    const load = async () => {
      const needed: Record<string, string> = {};
      if (module === 'produtos' || module === 'fornecedores') needed.categories = '/categorias';
      if (module === 'produtos') { needed.suppliers = '/fornecedores'; needed.units = '/unidades-medida'; }
      if (module === 'orcamentos') { needed.clients = '/clientes'; needed.products = '/produtos'; }
      const entries = await Promise.all(Object.entries(needed).map(async ([key, endpoint]) => {
        try { return [key, await apiFetch<unknown>(endpoint)] as const; } catch { return [key, []] as const; }
      }));
      if (active) {
        const mapped: Record<string, Option[]> = {};
        entries.forEach(([key, value]) => {
          let current = value as { data?: unknown };
          for (let i = 0; i < 3 && current && !Array.isArray(current); i++) current = current.data as typeof current;
          mapped[key] = Array.isArray(current) ? current as Option[] : [];
        });
        setOptions(mapped);
      }
      if (module === 'funcionarios' && canManageAccess) {
        try {
          const [permissionsPayload, rolesPayload] = await Promise.all([
            apiFetch<unknown>('/acessos/permissoes'),
            apiFetch<unknown>('/acessos/papeis'),
          ]);
          const unwrapList = (payload: unknown): Row[] => {
            let current = payload as Row;
            for (let i = 0; i < 4 && current && !Array.isArray(current); i++) current = current.data;
            return Array.isArray(current) ? current : [];
          };
          const permissions = unwrapList(permissionsPayload) as PermissionOption[];
          const roles = unwrapList(rolesPayload);
          if (active) {
            setPermissionOptions(permissions);
            const role = roles.find((item) => item.name === (row?.role ?? form.role));
            if (role) setInheritedPermissions(role.permission_ids ?? row?.role_permissions ?? []);
          }
        } catch { /* A API continua protegendo o cadastro; o formulário informa as permissões quando carregadas. */ }
      }
      if (row?.id && ['clientes', 'orcamentos'].includes(module)) {
        try {
          const details = await apiFetch<{ data?: Row }>(`/${module}/${row.id}`);
          let data = details as Row;
          for (let i = 0; i < 2 && data?.data; i++) data = data.data;
          if (active) setForm((current) => ({ ...current, ...data }));
        } catch { /* Mantém os dados disponíveis na listagem para edição. */ }
      }
    };
    void load();
    return () => { active = false; };
  }, [canManageAccess, module, row]);

  const permissionGroups = useMemo(() => permissionOptions.reduce<Record<string, PermissionOption[]>>((groups, permission) => {
    const group = permission.grupo || 'Outros';
    (groups[group] ??= []).push(permission);
    return groups;
  }, {}), [permissionOptions]);

  const change = (name: string, value: string) => setForm((current) => {
    const next = { ...current };
    if (name.startsWith('pf.') || name.startsWith('pj.') || name.startsWith('endereco.')) {
      const [group, key] = name.split('.'); next[group] = { ...(next[group] ?? {}), [key]: value };
    } else if (['preco_custo', 'porcentagem_lucro'].includes(name)) {
      next[name] = value;
      const cost = Number(name === 'preco_custo' ? value : next.preco_custo || 0);
      const profit = Number(name === 'porcentagem_lucro' ? value : next.porcentagem_lucro || 0);
      if (name !== 'preco_venda') next.preco_venda = (cost * (1 + profit / 100)).toFixed(2);
    } else next[name] = value;
    return next;
  });

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (module === 'fornecedores') {
        const parsed = fornecedorSchema.safeParse(payload);
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Revise os dados do fornecedor.');
        Object.assign(payload, parsed.data);
      }
      if (module === 'produtos') {
        ['preco_custo', 'porcentagem_lucro', 'preco_venda', 'estoque'].forEach((key) => payload[key] = Number(payload[key]));
        ['categoria_id', 'fornecedor_id'].forEach((key) => payload[key] ||= null);
        payload.validade ||= null;
        const parsed = produtoSchema.safeParse({ ...payload, categoria_id: payload.categoria_id || null });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Revise os dados do produto.');
        const categoryName = options.categories?.find((category) => category.id === payload.categoria_id)?.nome;
        if (validadeObrigatoria(parsed.data, categoryName)) throw new Error('A validade é obrigatória para esta categoria.');
      }
      if (module === 'funcionarios' && !payload.password) { delete payload.password; delete payload.password_confirmation; }
      if (module === 'funcionarios' && !canManageAccess) delete payload.permissions;
      if (module === 'funcionarios' && isSelf) delete payload.role;
      if (module === 'clientes') {
        if (payload.email === '') payload.email = null;
        payload.telefone ||= null;
        if (payload.tipo === 'pf') delete payload.pj; else delete payload.pf;
        payload.endereco = Object.fromEntries(Object.entries(payload.endereco ?? {}).filter(([, value]) => value !== ''));
      }
      if (module === 'orcamentos') payload.itens = (payload.itens ?? []).filter((item: Row) => item.produto_id).map((item: Row) => ({ produto_id: item.produto_id, quantidade: Number(item.quantidade || 1) }));
      await onSave(payload, row?.id);
      onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar o cadastro.'); }
    finally { setSaving(false); }
  }

  const select = (label: string, name: string, values: Option[], required = false, title: (option: Option) => string = (option) => option.nome ?? option.titulo ?? '') => <label className="editor-field"><span>{label}</span><select required={required} value={String(form[name] ?? '')} onChange={(event) => change(name, event.target.value)}><option value="">Selecione</option>{values.map((option) => <option value={option.id} key={option.id}>{title(option)}</option>)}</select></label>;
  const editorTitle: Record<string, string> = { clientes: 'Cliente', produtos: 'Produto', fornecedores: 'Fornecedor', funcionarios: 'Funcionário', orcamentos: 'Orçamento' };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="record-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title">
    <header className="editor-header"><div><span className="eyebrow">{edit ? 'ATUALIZAÇÃO' : 'NOVO CADASTRO'}</span><h2 id="editor-title">{edit ? 'Editar' : 'Cadastrar'} {editorTitle[module]}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar">×</button></header>
    <form onSubmit={submit} className="editor-form"><div className="editor-fields">
      {module === 'clientes' && <>
        <TextInput label="Nome" name="nome" value={form.nome} onChange={change} required />
        <label className="editor-field"><span>Tipo de cliente</span><select value={form.tipo ?? 'pf'} onChange={(event) => change('tipo', event.target.value)}><option value="pf">Pessoa física</option><option value="pj">Pessoa jurídica</option></select></label>
        <TextInput label="E-mail" name="email" value={form.email} onChange={change} type="email" /><TextInput label="Telefone" name="telefone" value={form.telefone} onChange={change} />
        {form.tipo === 'pf' ? <><TextInput label="CPF (somente números)" name="pf.cpf" value={form.pf?.cpf} onChange={change} required /><TextInput label="RG" name="pf.rg" value={form.pf?.rg} onChange={change} required /><TextInput label="Nascimento" name="pf.data_nascimento" value={form.pf?.data_nascimento} onChange={change} type="date" required /></> : <><TextInput label="CNPJ (somente números)" name="pj.cnpj" value={form.pj?.cnpj} onChange={change} required /><TextInput label="Razão social" name="pj.razao_social" value={form.pj?.razao_social} onChange={change} required /><TextInput label="Nome fantasia" name="pj.nome_fantasia" value={form.pj?.nome_fantasia} onChange={change} /><TextInput label="Responsável" name="pj.nome_responsavel" value={form.pj?.nome_responsavel} onChange={change} required /><TextInput label="CPF do responsável" name="pj.cpf_responsavel" value={form.pj?.cpf_responsavel} onChange={change} required /></>}
        <TextInput label="CEP" name="endereco.cep" value={form.endereco?.cep} onChange={change} /><TextInput label="Logradouro" name="endereco.logradouro" value={form.endereco?.logradouro} onChange={change} /><TextInput label="Número" name="endereco.numero" value={form.endereco?.numero} onChange={change} /><TextInput label="Cidade" name="endereco.cidade" value={form.endereco?.cidade} onChange={change} /><TextInput label="UF" name="endereco.estado" value={form.endereco?.estado} onChange={change} />
      </>}
      {module === 'fornecedores' && <><TextInput label="Nome" name="nome" value={form.nome} onChange={change} required /><TextInput label="CNPJ" name="cnpj" value={form.cnpj} onChange={change} required /><TextInput label="E-mail" name="email" value={form.email} onChange={change} type="email" /><TextInput label="Telefone" name="telefone" value={form.telefone} onChange={change} required /><label className="editor-field"><span>Ramos de atividade</span><select multiple value={form.categoria_ids ?? []} onChange={(event) => setForm((current) => ({ ...current, categoria_ids: Array.from(event.target.selectedOptions, (option) => option.value) }))}>{(options.categories ?? []).map((category) => <option value={category.id} key={category.id}>{category.nome}</option>)}</select></label><TextInput label="Responsável" name="nome_responsavel" value={form.nome_responsavel} onChange={change} /><TextInput label="Chave PIX" name="chave_pix" value={form.chave_pix} onChange={change} /></>}
      {module === 'produtos' && <><TextInput label="Nome" name="nome" value={form.nome} onChange={change} required /><TextInput label="Descrição" name="descricao" value={form.descricao} onChange={change} /><TextInput label="Preço de custo" name="preco_custo" value={form.preco_custo} onChange={change} type="number" required /><TextInput label="Margem de lucro (%)" name="porcentagem_lucro" value={form.porcentagem_lucro} onChange={change} type="number" required /><TextInput label="Preço de venda" name="preco_venda" value={form.preco_venda} onChange={change} type="number" required /><TextInput label="Estoque" name="estoque" value={form.estoque} onChange={change} type="number" required /><TextInput label="Entrada" name="data_entrada" value={form.data_entrada} onChange={change} type="date" required /><TextInput label="Validade" name="validade" value={form.validade} onChange={change} type="date" />{select('Categoria', 'categoria_id', options.categories ?? [])}{select('Fornecedor', 'fornecedor_id', options.suppliers ?? [])}{select('Unidade de medida', 'unidade_medida_id', options.units ?? [], true, (option) => `${option.nome ?? option.titulo ?? ''}${option.sigla ? ` (${option.sigla})` : ''}`)}</>}
      {module === 'funcionarios' && <><TextInput label="Nome" name="name" value={form.name ?? form.nome} onChange={change} required /><TextInput label="E-mail" name="email" value={form.email} onChange={change} type="email" required /><TextInput label={edit ? 'Nova senha (opcional)' : 'Senha'} name="password" value={form.password} onChange={change} type="password" required={!edit} /><TextInput label="Confirmar senha" name="password_confirmation" value={form.password_confirmation} onChange={change} type="password" /><TextInput label="Telefone" name="telefone" value={form.telefone} onChange={change} /><TextInput label="CPF (somente números)" name="cpf" value={form.cpf} onChange={change} required /><TextInput label="Nascimento" name="data_nascimento" value={form.data_nascimento} onChange={change} type="date" required />{!isSelf && <label className="editor-field"><span>Perfil</span><select value={form.role ?? 'funcionario'} onChange={(event) => { change('role', event.target.value); const selectedRole = event.target.value; void apiFetch<unknown>('/acessos/papeis').then((payload) => { let current = payload as Row; for (let i = 0; i < 4 && current && !Array.isArray(current); i++) current = current.data; const role = Array.isArray(current) ? current.find((item: Row) => item.name === selectedRole) : null; setInheritedPermissions(role?.permission_ids ?? []); }).catch(() => setInheritedPermissions([])); }}><option value="funcionario">Funcionário</option><option value="gestor">Gestor</option></select></label>}{canManageAccess && <section className="permission-editor"><div className="permission-editor-heading"><strong>Permissões individuais</strong><span>Permissões herdadas do perfil ficam marcadas e bloqueadas.</span></div>{Object.entries(permissionGroups).map(([group, permissions]) => <fieldset className="permission-group" key={group}><legend>{group}</legend>{permissions.map((permission) => { const inherited = inheritedPermissions.includes(permission.id); const checked = inherited || (form.permissions ?? []).includes(permission.id); return <label className={`permission-option ${inherited ? 'inherited' : ''}`} key={permission.id}><input type="checkbox" checked={checked} disabled={inherited} onChange={(event) => setForm((current) => ({ ...current, permissions: event.target.checked ? [...new Set([...(current.permissions ?? []), permission.id])] : (current.permissions ?? []).filter((id: string) => id !== permission.id) }))} /><span>{permission.nome}</span><small>{permission.acao}{inherited ? ' · do perfil' : ''}</small></label>; })}</fieldset>)}{permissionOptions.length === 0 && <p className="permission-empty">Carregando permissões disponíveis…</p>}</section>}</>}
      {module === 'orcamentos' && <><TextInput label="Título do orçamento" name="titulo" value={form.titulo} onChange={change} required />{select('Cliente', 'cliente_id', options.clients ?? [], true)}<div className="quote-items-editor"><div className="quote-items-heading"><strong>Produtos</strong><button type="button" className="text-button" onClick={() => setForm((current) => ({ ...current, itens: [...(current.itens ?? []), { produto_id: '', quantidade: 1 }] }))}>+ Adicionar produto</button></div>{(form.itens ?? []).map((item: Row, index: number) => <div className="quote-item-row" key={index}><select value={item.produto_id ?? ''} onChange={(event) => setForm((current) => ({ ...current, itens: current.itens.map((entry: Row, entryIndex: number) => entryIndex === index ? { ...entry, produto_id: event.target.value } : entry) }))}><option value="">Produto</option>{(options.products ?? []).map((product) => <option key={product.id} value={product.id}>{product.nome}</option>)}</select><input type="number" min="1" value={item.quantidade ?? 1} onChange={(event) => setForm((current) => ({ ...current, itens: current.itens.map((entry: Row, entryIndex: number) => entryIndex === index ? { ...entry, quantidade: event.target.value } : entry) }))} /><button type="button" className="remove-item" onClick={() => setForm((current) => ({ ...current, itens: current.itens.filter((_: Row, entryIndex: number) => entryIndex !== index) }))}>×</button></div>)}</div></>}
    </div>{error && <div className="form-error">{error}</div>}<footer className="editor-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? 'Salvando…' : 'Salvar cadastro'}</button></footer></form>
  </section></div>;
}

'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { MenuItem, TextField } from '@mui/material';
import { UserAvatar } from '@/components/UserAvatar';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { fornecedorSchema } from '@/schemas/records';
import { getCepAddress } from '@/lib/cep';
import { EmployeePermissionsDialog, type EmployeePermission } from './EmployeePermissionsDialog';
import { SupplierCategoriesDialog } from './SupplierCategoriesDialog';
import { entityFieldSx, entityMenuProps, entityQuoteFieldSx } from '../formFieldStyles';
import pageStyles from '../clients/ClientEditorPage.module.css';
import styles from './BusinessEditorPage.module.css';

type Row = Record<string, any>;
type Module = 'fornecedores' | 'funcionarios' | 'orcamentos';
type Option = { id: string; nome?: string; titulo?: string; sigla?: string; preco_venda?: number };
type Props = { module: Module; recordId?: string };
const digits = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max);
function displayValue(name: string, value: unknown) {
  const raw = String(value ?? '');
  if (name === 'cnpj') { const d = digits(raw, 14); return `${d.slice(0, 2)}${d.length > 2 ? `.${d.slice(2, 5)}` : ''}${d.length > 5 ? `.${d.slice(5, 8)}` : ''}${d.length > 8 ? `/${d.slice(8, 12)}` : ''}${d.length > 12 ? `-${d.slice(12)}` : ''}`; }
  if (name === 'cpf') { const d = digits(raw, 11); return `${d.slice(0, 3)}${d.length > 3 ? `.${d.slice(3, 6)}` : ''}${d.length > 6 ? `.${d.slice(6, 9)}` : ''}${d.length > 9 ? `-${d.slice(9)}` : ''}`; }
  if (name === 'telefone') { const d = digits(raw, 11); if (d.length < 3) return d; const split = d.length > 7 ? d.length - 4 : d.length; return `(${d.slice(0, 2)}) ${d.slice(2, split)}${d.length > split ? `-${d.slice(split)}` : ''}`; }
  if (name === 'endereco.cep') { const d = digits(raw, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; }
  return raw;
}

const empty = (module: Module): Row => module === 'fornecedores'
  ? { nome: '', cnpj: '', email: '', telefone: '', categoria_ids: [], nome_responsavel: '', chave_pix: '', endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' } }
  : module === 'funcionarios'
    ? { name: '', email: '', password: '', password_confirmation: '', telefone: '', cpf: '', data_nascimento: '', role: 'funcionario', permissions: [] }
    : { titulo: '', cliente_id: '', itens: [] };

function list(payload: unknown): Row[] {
  let current: any = payload;
  for (let i = 0; i < 5 && current && !Array.isArray(current); i++) current = current.data;
  return Array.isArray(current) ? current : [];
}
function record(payload: unknown): Row {
  let current: any = payload;
  for (let i = 0; i < 5 && current?.data && !Array.isArray(current.data); i++) current = current.data;
  return current ?? {};
}
function Input({ label, name, value, onChange, type = 'text', required, hint, disabled, onBlur, placeholder, large = false }: { label: string; name: string; value: unknown; onChange: (name: string, value: string) => void; type?: string; required?: boolean; hint?: string; disabled?: boolean; onBlur?: () => void; placeholder?: string; large?: boolean }) {
  return <div className={styles.field}><TextField fullWidth variant="outlined" label={label} name={name} type={type} value={displayValue(name, value)} placeholder={placeholder} onChange={(event) => onChange(name, ['cnpj', 'cpf', 'telefone', 'endereco.cep'].includes(name) ? digits(event.target.value, name === 'cnpj' ? 14 : name === 'cpf' ? 11 : name === 'endereco.cep' ? 8 : 11) : event.target.value)} onBlur={onBlur} required={required} disabled={disabled} helperText={hint} sx={large ? entityQuoteFieldSx : entityFieldSx} slotProps={{ inputLabel: { shrink: !!placeholder || type === 'date' } }} /></div>;
}

export function BusinessEditorPage({ module, recordId }: Props) {
  const router = useRouter();
  const { user, can } = useAuth();
  const { showToast } = useToast();
  const edit = !!recordId;
  const [form, setForm] = useState<Row>(() => empty(module));
  const [original, setOriginal] = useState<Row>(() => empty(module));
  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [permissions, setPermissions] = useState<EmployeePermission[]>([]);
  const [inherited, setInherited] = useState<string[]>([]);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(edit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const supplierImageInput = useRef<HTMLInputElement>(null);
  const closePermissionsDialog = useCallback(() => setShowPermissionsDialog(false), []);
  const endpoint = module;
  const title = module === 'fornecedores' ? 'fornecedor' : module === 'funcionarios' ? 'funcionário' : 'orçamento';
  const canEditAccess = module === 'funcionarios' && can('acessos.gerenciar') && String(user?.id ?? '') !== String(recordId ?? '');
  const isSelf = module === 'funcionarios' && !!recordId && String(user?.id ?? '') === String(recordId);
  const status = String(form.status ?? 'pendente').toLowerCase();
  const quoteLocked = module === 'orcamentos' && edit && status !== 'pendente';

  useEffect(() => {
    if (!image) { setImagePreview(''); return; }
    const url = URL.createObjectURL(image); setImagePreview(url); return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    let active = true;
    const endpoints: Record<string, string> = module === 'fornecedores' ? { categories: '/categorias' }
      : module === 'funcionarios' && canEditAccess ? { permissions: '/acessos/permissoes', roles: '/acessos/papeis' }
        : module === 'orcamentos' ? { clients: '/clientes', products: '/produtos' } : {};
    void Promise.all(Object.entries(endpoints).map(async ([key, path]) => {
      try { return [key, await apiFetch<unknown>(path)] as const; } catch { return [key, []] as const; }
    })).then(async (entries) => {
      if (!active) return;
      const mapped: Record<string, any[]> = {};
      entries.forEach(([key, payload]) => mapped[key] = list(payload));
      setOptions(mapped);
      if (module === 'funcionarios' && canEditAccess) {
        setPermissions((mapped.permissions ?? []) as EmployeePermission[]);
        const role = (mapped.roles ?? []).find((item) => item.name === (form.role ?? 'funcionario'));
        setInherited((role?.permission_ids ?? []).map(String));
      }
      if (edit && recordId) {
        try {
          let payload: unknown = await apiFetch<unknown>(`/${endpoint}/${recordId}`);
          const data = record(payload);
          if (module === 'fornecedores') data.categoria_ids = (data.categorias ?? []).map((item: Row) => String(item.id));
          if (module === 'funcionarios') {
            data.name = data.name ?? data.nome ?? '';
            data.password = ''; data.password_confirmation = '';
            data.permissions = (data.permissions ?? []).map((permission: any) => String(typeof permission === 'object' ? permission.id ?? permission.name : permission));
          }
          if (module === 'orcamentos') {
            const quoteProducts = (data.itens ?? []).map((item: Row) => item.produto).filter(Boolean) as Option[];
            setOptions((current) => ({ ...current, products: [...new Map([...(current.products ?? []), ...quoteProducts].map((product) => [String(product.id), product])).values()] }));
            data.itens = (data.itens ?? []).map((item: Row) => ({ produto_id: String(item.produto_id ?? item.produto?.id ?? ''), quantidade: String(item.quantidade ?? 1) }));
          }
          if (active) { setForm({ ...empty(module), ...data }); setOriginal({ ...empty(module), ...data }); }
          if (module === 'funcionarios' && active) setInherited((data.role_permissions ?? []).map(String));
        } catch (reason) { if (active) showToast(reason instanceof Error ? reason.message : `Não foi possível carregar o ${title}.`, 'error'); }
        finally { if (active) setLoading(false); }
      }
    });
    return () => { active = false; };

  }, [module, recordId, endpoint, canEditAccess]);

  const dirty = JSON.stringify(form) !== JSON.stringify(original) || !!image || removeImage;
  const quoteItemsValid = (form.itens ?? []).some((item: Row) => !!item.produto_id)
    && (form.itens ?? []).filter((item: Row) => item.produto_id).every((item: Row) => Number.isInteger(Number(item.quantidade)) && Number(item.quantidade) >= 1);
  const requiredValid = module === 'fornecedores'
    ? !!String(form.nome ?? '').trim() && String(form.cnpj ?? '').replace(/\D/g, '').length === 14
    : module === 'funcionarios'
      ? !!String(form.name ?? '').trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email ?? '')) && String(form.cpf ?? '').replace(/\D/g, '').length === 11 && !!form.data_nascimento && (edit || String(form.password ?? '').length >= 8) && (!form.password || (String(form.password).length >= 8 && form.password === form.password_confirmation))
      : !!String(form.titulo ?? '').trim() && !!form.cliente_id && quoteItemsValid;
  const canSave = requiredValid && (!edit || dirty) && !quoteLocked;
  const { requestNavigation, navigateWithoutConfirmation, dialog } = useUnsavedChangesGuard(dirty);
  const currentImage = removeImage ? '' : imagePreview || form.avatar_url || form.avatar || '';

  function change(name: string, value: string) {
    setForm((current) => {
      if (name.includes('.')) { const [group, key] = name.split('.'); return { ...current, [group]: { ...(current[group] ?? {}), [key]: value } }; }
      return { ...current, [name]: value };
    });
  }
  async function lookupCep() {
    const cep = digits(String(form.endereco?.cep ?? ''), 8);
    if (module !== 'fornecedores' || cep.length !== 8) return;
    try {
      const address = await getCepAddress(cep);
      setForm((current) => ({ ...current, endereco: { ...(current.endereco ?? {}), logradouro: address.logradouro ?? '', complemento: address.complemento ?? '', bairro: address.bairro ?? '', cidade: address.localidade ?? '', estado: address.uf ?? '' } }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível consultar o CEP.'); }
  }
  function goBack() { requestNavigation(() => router.push(`/${module}`)); }
  function select(label: string, name: string, values: Option[], required = false, disabled = false) {
    return <div className={styles.field}><TextField fullWidth select variant="outlined" label={label} required={required} disabled={disabled} value={String(form[name] ?? '')} onChange={(event) => change(name, String(event.target.value))} sx={entityQuoteFieldSx} slotProps={{ select: { MenuProps: entityMenuProps } }}><MenuItem value="">Selecione</MenuItem>{values.map((item) => <MenuItem key={item.id} value={item.id}>{item.nome ?? item.titulo ?? ''}</MenuItem>)}</TextField></div>;
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (module === 'orcamentos') {
      const items = (form.itens ?? []).filter((item: Row) => item.produto_id);
      if (!form.titulo?.trim() || !form.cliente_id || !items.length || items.some((item: Row) => !Number.isInteger(Number(item.quantidade)) || Number(item.quantidade) < 1)) {
        setError('Informe o título, selecione um cliente e adicione produtos com quantidades inteiras maiores que zero.'); return;
      }
    }
    setSaving(true);
    try {
      let payload: Row = { ...form };
      if (module === 'fornecedores') {
        const parsed = fornecedorSchema.safeParse({ ...payload, cnpj: String(payload.cnpj ?? '').replace(/\D/g, ''), categoria_ids: (payload.categoria_ids ?? []).map(String) });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Revise os dados do fornecedor.');
        payload = { nome: String(payload.nome).trim(), cnpj: String(parsed.data.cnpj).replace(/\D/g, ''), email: payload.email || null, telefone: String(payload.telefone ?? '').replace(/\D/g, '') || null, categoria_ids: parsed.data.categoria_ids, nome_responsavel: payload.nome_responsavel || null, chave_pix: payload.chave_pix || null, endereco: { ...(payload.endereco ?? {}), cep: digits(String(payload.endereco?.cep ?? ''), 8), estado: String(payload.endereco?.estado ?? '').toUpperCase() } };
      } else if (module === 'funcionarios') {
        if (String(payload.password ?? '').length > 0 && String(payload.password).length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');
        if (payload.password && payload.password !== payload.password_confirmation) throw new Error('As senhas não correspondem.');
        if (!edit && (!payload.password || payload.password !== payload.password_confirmation)) throw new Error('Informe e confirme a senha do funcionário.');
        const employeePayload: Row = { name: String(payload.name).trim(), email: String(payload.email).trim(), telefone: String(payload.telefone ?? '').replace(/\D/g, '') || null, cpf: String(payload.cpf ?? '').replace(/\D/g, ''), data_nascimento: payload.data_nascimento };
        if (!isSelf) employeePayload.role = payload.role ?? 'funcionario';
        if (canEditAccess) employeePayload.permissions = payload.permissions ?? [];
        if (payload.password) { employeePayload.password = payload.password; employeePayload.password_confirmation = payload.password_confirmation; }
        payload = employeePayload;
      } else {
        payload = { titulo: payload.titulo.trim(), cliente_id: payload.cliente_id, itens: (payload.itens ?? []).filter((item: Row) => item.produto_id).map((item: Row) => ({ produto_id: item.produto_id, quantidade: Number(item.quantidade) })) };
      }
      const response = await apiFetch<unknown>(edit ? `/${module}/${recordId}` : `/${module}`, { method: edit ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      const saved = record(response);
      const savedId = recordId ?? saved.id;
      if (module !== 'orcamentos' && savedId && image) {
        const data = new FormData(); data.append('avatar', image);
        await apiFetch(`/${module}/${savedId}/${module === 'fornecedores' ? 'imagem' : 'avatar'}`, { method: 'POST', body: data });
      } else if (module !== 'orcamentos' && edit && savedId && removeImage) {
        await apiFetch(`/${module}/${savedId}/${module === 'fornecedores' ? 'imagem' : 'avatar'}`, { method: 'DELETE' });
      }
      showToast(`${title[0].toUpperCase()}${title.slice(1)} ${edit ? 'atualizado' : 'cadastrado'} com sucesso.`, 'success');
      navigateWithoutConfirmation(() => router.push(`/${module}`));
    } catch (reason) { setError(reason instanceof Error ? reason.message : `Não foi possível salvar o ${title}.`); }
    finally { setSaving(false); }
  }

  const icon = module === 'fornecedores' ? 'mdi:truck-outline' : module === 'funcionarios' ? 'mdi:account-cog-outline' : 'mdi:file-document-outline';
  const eyebrow = module === 'fornecedores' ? 'COMPRAS · PARCERIAS' : module === 'funcionarios' ? 'EQUIPE · ACESSOS' : 'VENDAS · NEGOCIAÇÃO';
  const description = module === 'fornecedores' ? 'Cadastre os dados de contato e os ramos de atividade do parceiro.' : module === 'funcionarios' ? 'Configure os dados de acesso, o perfil e as permissões do membro da equipe.' : 'Defina o cliente, os produtos e as quantidades da proposta comercial.';
  const employeeFields = <>
    <Input label="Nome completo" name="name" value={form.name} onChange={change} required placeholder="Ex.: Maria da Silva" />
    <Input label="E-mail" name="email" value={form.email} onChange={change} type="email" required placeholder="nome@empresa.com.br" />
    <Input label={edit ? 'Nova senha (opcional)' : 'Senha'} name="password" value={form.password} onChange={change} type="password" required={!edit} hint="Mínimo de 8 caracteres." placeholder={edit ? 'Deixe em branco para manter a senha atual' : 'Crie uma senha com pelo menos 8 caracteres'} />
    <Input label="Confirmar senha" name="password_confirmation" value={form.password_confirmation} onChange={change} type="password" required={!edit} placeholder="Digite a senha novamente" />
    <Input label="Telefone" name="telefone" value={form.telefone} onChange={change} placeholder="(11) 99999-9999" />
    <Input label="CPF" name="cpf" value={form.cpf} onChange={change} required hint="Informe os 11 dígitos do CPF." placeholder="000.000.000-00" />
    <Input label="Data de nascimento" name="data_nascimento" value={String(form.data_nascimento ?? '').slice(0, 10)} onChange={change} type="date" required />
    {!isSelf && canEditAccess && <div className={styles.field}><TextField fullWidth select label="Perfil de acesso" value={form.role ?? 'funcionario'} onChange={async (event) => { const role = String(event.target.value); change('role', role); try { const roles = list(await apiFetch<unknown>('/acessos/papeis')); setInherited((roles.find((item) => item.name === role)?.permission_ids ?? []).map(String)); } catch { setInherited([]); } }} sx={entityFieldSx} slotProps={{ select: { MenuProps: entityMenuProps } }}><MenuItem value="funcionario">Funcionário</MenuItem><MenuItem value="gestor">Gestor</MenuItem></TextField></div>}
  </>;

  return <main className={pageStyles.page}>
    <header className={pageStyles.pageHeader}>
      <button type="button" className={pageStyles.backButton} onClick={goBack}><Icon icon="mdi:arrow-left" width={23} height={23} />Voltar para {module === 'orcamentos' ? 'orçamentos' : module}</button>
      <div className={pageStyles.titleActions}><div className={pageStyles.titleCopy}><span className={pageStyles.eyebrow}><Icon icon={icon} width={18} height={18} />{eyebrow}</span><h1>{edit ? 'Editar' : 'Novo'} {title}</h1><p>{description}</p></div><button type="submit" form="business-editor-form" className={pageStyles.saveButton} disabled={saving || loading || !canSave}>{saving ? <><span className={pageStyles.buttonSpinner} />Salvando…</> : <><Icon icon="mdi:content-save-outline" width={21} height={21} />Salvar {title}</>}</button></div>
    </header>
    {loading ? <div className={pageStyles.loading}><span className="spinner" />Carregando dados…</div> : <form id="business-editor-form" className={styles.form} onSubmit={submit}>
      {module === 'funcionarios' && <div className={styles.employeeLayout}>
        <section className={`${styles.section} ${styles.employeeProfilePanel}`} aria-label="Foto de perfil">
          <UserAvatar name={String(form.name || 'Funcionário')} imageUrl={currentImage} fallbackIcon="mdi:account-outline" size={86} className={styles.profileAvatar} />
          <div className={styles.profileCopy}><strong>Foto de perfil</strong><span>JPG, PNG ou WebP · até 2 MB</span><div className={styles.profileActions}>
            <label className={styles.avatarUpload}><Icon icon="mdi:camera-outline" />{image || currentImage ? 'Alterar foto' : 'Adicionar foto'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0] ?? null; if (file && file.size > 2 * 1024 * 1024) { setError('A imagem não pode ultrapassar 2 MB.'); event.target.value = ''; return; } setImage(file); setRemoveImage(false); }} /></label>
            {currentImage && <button type="button" className={styles.removeAvatar} onClick={() => { setImage(null); setImagePreview(''); setRemoveImage(true); }}>Remover</button>}
          </div></div>
        </section>
        <section className={`${styles.section} ${styles.employeeDataPanel}`} aria-labelledby="employee-data-title">
          <header className={styles.sectionHeading}><span>01</span><div><h2 id="employee-data-title">Dados da conta</h2><p>Identificação, contato e acesso ao sistema.</p></div></header>
          <div className={`${styles.grid} ${styles.employeeGrid}`}>{employeeFields}</div>
        </section>
      </div>}
      {module === 'fornecedores' && <div className={styles.supplierLayout}>
        <section className={`${styles.section} ${styles.supplierProfilePanel}`} aria-label="Imagem do fornecedor">
          <UserAvatar name={String(form.nome || 'Fornecedor')} imageUrl={currentImage} fallbackIcon="mdi:store-outline" size={86} className={styles.profileAvatar} />
          <div className={styles.profileCopy}><strong>Imagem do fornecedor</strong><span>JPG, PNG ou WebP · até 2 MB</span><div className={styles.profileActions}>
            <button type="button" className={styles.avatarUpload} onClick={() => supplierImageInput.current?.click()}><Icon icon="mdi:camera-outline" />{image || currentImage ? 'Alterar imagem' : 'Adicionar imagem'}</button>
            {currentImage && <button type="button" className={styles.removeAvatar} onClick={() => { setImage(null); setImagePreview(''); setRemoveImage(true); }}>Remover</button>}
          </div></div>
          <input ref={supplierImageInput} className={styles.visuallyHiddenInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Selecionar imagem do fornecedor" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file && file.size > 2 * 1024 * 1024) { setError('A imagem não pode ultrapassar 2 MB.'); return; } setError(''); setImage(file); setRemoveImage(false); }} />
        </section>
        <section className={`${styles.section} ${styles.supplierDataPanel}`} aria-labelledby="supplier-data-title">
          <header className={styles.sectionHeading}><span>01</span><div><h2 id="supplier-data-title">Identificação e contato</h2><p>Dados principais para reconhecer e contatar o fornecedor.</p></div></header>
          <div className={`${styles.grid} ${styles.supplierGrid}`}>
            <Input label="Nome" name="nome" value={form.nome} onChange={change} required placeholder="Ex.: Distribuidora Central" />
            <Input label="CNPJ" name="cnpj" value={form.cnpj} onChange={change} required hint="Informe os 14 dígitos do CNPJ." placeholder="00.000.000/0000-00" />
            <Input label="E-mail" name="email" value={form.email} onChange={change} type="email" placeholder="contato@empresa.com.br" />
            <Input label="Telefone" name="telefone" value={form.telefone} onChange={change} placeholder="(11) 99999-9999" />
            <Input label="Responsável" name="nome_responsavel" value={form.nome_responsavel} onChange={change} placeholder="Nome do responsável" />
            <Input label="Chave PIX" name="chave_pix" value={form.chave_pix} onChange={change} placeholder="E-mail, documento, telefone ou aleatória" />
            <div className={styles.categorySelector}>
              <span className={styles.categorySelectorIcon}><Icon icon="mdi:shape-outline" width={20} height={20} /></span>
              <div className={styles.categorySelectorCopy}><strong>Ramos de atividade</strong><span>{(form.categoria_ids ?? []).length ? `${form.categoria_ids.length} ramo(s) selecionado(s)` : 'Nenhum ramo selecionado'}</span></div>
              <button type="button" className={styles.categoryDialogButton} onClick={() => setShowCategoriesDialog(true)}><Icon icon="mdi:tune-variant" width={17} height={17} />Configurar</button>
            </div>
          </div>
        </section>
        <section className={`${styles.section} ${styles.supplierAddressPanel}`} aria-labelledby="supplier-address-title">
          <header className={styles.sectionHeading}><span>02</span><div><h2 id="supplier-address-title">Endereço</h2><p>Localização do fornecedor para consulta e documentos.</p></div></header>
          <div className={`${styles.grid} ${styles.supplierAddressGrid}`}>
            <Input label="CEP" name="endereco.cep" value={form.endereco?.cep} onChange={change} onBlur={() => void lookupCep()} placeholder="00000-000" />
            <Input label="Logradouro" name="endereco.logradouro" value={form.endereco?.logradouro} onChange={change} placeholder="Rua, avenida ou estrada" />
            <Input label="Número" name="endereco.numero" value={form.endereco?.numero} onChange={change} placeholder="Nº" />
            <Input label="Complemento" name="endereco.complemento" value={form.endereco?.complemento} onChange={change} placeholder="Apto., sala, bloco..." />
            <Input label="Bairro" name="endereco.bairro" value={form.endereco?.bairro} onChange={change} placeholder="Nome do bairro" />
            <Input label="Cidade" name="endereco.cidade" value={form.endereco?.cidade} onChange={change} placeholder="Nome da cidade" />
            <Input label="UF" name="endereco.estado" value={form.endereco?.estado} onChange={change} placeholder="SP" />
          </div>
        </section>
      </div>}
      {module === 'funcionarios' && canEditAccess && <section className={`${styles.section} ${styles.permissionTriggerSection}`} aria-labelledby="employee-permissions-title">
        <div className={styles.permissionTriggerCopy}><span className={styles.permissionTriggerIcon}><Icon icon="mdi:shield-account-outline" width={21} height={21} /></span><div><h2 id="employee-permissions-title">Permissões individuais</h2><p>Adicione acessos além dos definidos pelo perfil.</p></div></div>
        <span className={styles.permissionCount}>{(form.permissions ?? []).length} selecionadas</span>
        <button type="button" className={styles.openPermissionsButton} onClick={() => setShowPermissionsDialog(true)}><Icon icon="mdi:tune-variant" width={18} height={18} />Configurar permissões</button>
      </section>}
      {showPermissionsDialog && <EmployeePermissionsDialog
        permissions={permissions}
        selected={(form.permissions ?? []).map(String)}
        inherited={inherited}
        onChange={(selected) => setForm((current) => ({ ...current, permissions: selected }))}
        onClose={closePermissionsDialog}
      />}
      {showCategoriesDialog && <SupplierCategoriesDialog
        categories={options.categories ?? []}
        selected={(form.categoria_ids ?? []).map(String)}
        onChange={(categoria_ids) => setForm((current) => ({ ...current, categoria_ids }))}
        onClose={() => setShowCategoriesDialog(false)}
      />}
      {module === 'orcamentos' && <>
        <section className={`${styles.section} ${styles.quoteSection}`}>
          <h2><Icon icon="mdi:file-document-edit-outline" />Dados do orçamento</h2>
          <div className={styles.grid}>
            <Input label="Título do orçamento" name="titulo" value={form.titulo} onChange={change} required disabled={quoteLocked} placeholder="Ex.: Reforma do escritório" large />
            {select('Cliente', 'cliente_id', options.clients ?? [], true, quoteLocked)}
            {edit && <div className={styles.status}><strong>Status</strong><span>{status}</span></div>}
          </div>
        </section>
        <section className={`${styles.section} ${styles.quoteSection}`}>
          <div className={styles.itemsHeading}><h2><Icon icon="mdi:package-variant-closed" />Produtos</h2><button type="button" disabled={quoteLocked} onClick={() => setForm((current) => ({ ...current, itens: [...(current.itens ?? []), { produto_id: '', quantidade: 1 }] }))}><Icon icon="mdi:plus" />Adicionar produto</button></div>
          {(form.itens ?? []).map((item: Row, index: number) => {
            const product = (options.products ?? []).find((entry) => String(entry.id) === String(item.produto_id));
            return <div className={styles.itemRow} key={`${item.produto_id}-${index}`}>
              <div className={styles.field}><TextField fullWidth select label="Produto" disabled={quoteLocked} value={item.produto_id ?? ''} onChange={(event) => setForm((current) => ({ ...current, itens: current.itens.map((row: Row, position: number) => position === index ? { ...row, produto_id: event.target.value } : row) }))} sx={entityQuoteFieldSx} slotProps={{ select: { MenuProps: entityMenuProps } }}><MenuItem value="">Selecione um produto</MenuItem>{(options.products ?? []).map((entry) => <MenuItem key={entry.id} value={entry.id}>{entry.nome}</MenuItem>)}</TextField></div>
              <div className={styles.field}><TextField fullWidth label="Quantidade" disabled={quoteLocked} type="number" value={item.quantidade ?? 1} placeholder="Ex.: 1" onChange={(event) => setForm((current) => ({ ...current, itens: current.itens.map((row: Row, position: number) => position === index ? { ...row, quantidade: event.target.value } : row) }))} sx={entityQuoteFieldSx} slotProps={{ htmlInput: { min: 1, step: 1 } }} /></div>
              <div className={styles.lineTotal}><span>Subtotal estimado</span><strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.quantidade || 0) * Number(product?.preco_venda || 0))}</strong></div>
              <button disabled={quoteLocked} type="button" className={styles.removeItem} aria-label="Remover produto" onClick={() => setForm((current) => ({ ...current, itens: current.itens.filter((_: Row, position: number) => position !== index) }))}><Icon icon="mdi:trash-can-outline" /></button>
            </div>;
          })}
          {!form.itens?.length && <p className={styles.hint}>Adicione ao menos um produto para compor o orçamento.</p>}
          <div className={styles.total}><span>Total estimado</span><strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((form.itens ?? []).reduce((sum: number, item: Row) => sum + Number(item.quantidade || 0) * Number((options.products ?? []).find((product) => String(product.id) === String(item.produto_id))?.preco_venda || 0), 0))}</strong></div>
        </section>
      </>}
      {error && <div className={pageStyles.error} role="alert"><Icon icon="mdi:alert-circle-outline" width={20} height={20} />{error}</div>}
      <footer className={pageStyles.actions}><span>{quoteLocked ? 'Orçamentos aprovados ou convertidos em venda não podem ser editados.' : edit ? dirty ? 'Há alterações prontas para salvar.' : 'Altere algum dado para habilitar o salvamento.' : requiredValid ? 'Cadastro pronto para salvar.' : module === 'fornecedores' ? 'Informe o nome e um CNPJ com 14 dígitos.' : module === 'funcionarios' ? 'Informe nome, e-mail, CPF, nascimento e uma senha válida.' : 'Informe um título, selecione cliente e adicione produtos com quantidades válidas.'}</span></footer>
    </form>}
    {dialog}
  </main>;
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { getCepAddress } from '@/lib/cep';
import { ClientEditorFields } from './ClientEditorFields';
import styles from './ClientEditorPage.module.css';

type ClientData = Record<string, any>;
type FieldErrors = Record<string, string>;

const onlyDigits = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max);
const formatCpf = (value: string) => {
  const digits = onlyDigits(value, 11);
  return `${digits.slice(0, 3)}${digits.length > 3 ? `.${digits.slice(3, 6)}` : ''}${digits.length > 6 ? `.${digits.slice(6, 9)}` : ''}${digits.length > 9 ? `-${digits.slice(9, 11)}` : ''}`;
};
const formatCnpj = (value: string) => {
  const digits = onlyDigits(value, 14);
  return `${digits.slice(0, 2)}${digits.length > 2 ? `.${digits.slice(2, 5)}` : ''}${digits.length > 5 ? `.${digits.slice(5, 8)}` : ''}${digits.length > 8 ? `/${digits.slice(8, 12)}` : ''}${digits.length > 12 ? `-${digits.slice(12, 14)}` : ''}`;
};
const formatPhone = (value: string) => {
  const digits = onlyDigits(value, 11);
  if (digits.length < 2) return digits;
  if (digits.length === 2) return `(${digits})`;
  const area = digits.slice(0, 2);
  const subscriber = digits.slice(2);
  return `(${area}) ${subscriber.length > 5 ? `${subscriber.slice(0, subscriber.length === 9 ? 5 : 4)}-${subscriber.slice(subscriber.length === 9 ? 5 : 4)}` : subscriber}`;
};
const formatCep = (value: string) => onlyDigits(value, 8).replace(/^(\d{5})(\d)/, '$1-$2');
const formatRg = (value: string) => {
  const cleaned = value.replace(/[^0-9x]/gi, '').toUpperCase().slice(0, 14);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, -1)}-${cleaned.slice(-1)}`;
};

function hasValidCpf(value: string) {
  const cpf = onlyDigits(value, 11);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const digit = (length: number) => {
    const sum = cpf.slice(0, length).split('').reduce((total, number, index) => total + Number(number) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function hasValidCnpj(value: string) {
  const cnpj = onlyDigits(value, 14);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const check = (base: string, weights: number[]) => {
    const remainder = base.split('').reduce((sum, number, index) => sum + Number(number) * weights[index], 0) % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return check(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(cnpj[12])
    && check(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(cnpj[13]);
}

function validateClient(form: ClientData): FieldErrors {
  const errors: FieldErrors = {};
  const value = (path: string) => path.split('.').reduce((current, key) => current?.[key], form)?.toString().trim() ?? '';
  const cpf = form.tipo === 'pf' ? 'pf.cpf' : 'pj.cpf_responsavel';
  if (!value('nome')) errors.nome = 'Informe o nome do cliente.';
  else if (value('nome').length > 255) errors.nome = 'Use até 255 caracteres.';
  const email = value('email');
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)) errors.email = 'Informe um e-mail válido com até 255 caracteres.';
  const phone = onlyDigits(value('telefone'), 12);
  if (value('telefone') && ![10, 11].includes(phone.length)) errors.telefone = 'Informe DDD e telefone com 10 ou 11 dígitos.';
  if (form.tipo === 'pf') {
    if (!value('pf.cpf')) errors['pf.cpf'] = 'O CPF é obrigatório.';
    else if (!hasValidCpf(value('pf.cpf'))) errors['pf.cpf'] = 'Informe um CPF válido.';
    const rg = value('pf.rg').replace(/[^0-9x]/gi, '').toUpperCase();
    if (!rg) errors['pf.rg'] = 'O RG é obrigatório.';
    else if (!/^\d{4,13}[0-9X]$/.test(rg)) errors['pf.rg'] = 'Use de 5 a 14 caracteres numéricos; X pode ser o último.';
    const birthDate = value('pf.data_nascimento');
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (!birthDate) errors['pf.data_nascimento'] = 'A data de nascimento é obrigatória.';
    else if (birthDate >= todayString) errors['pf.data_nascimento'] = 'A data deve ser anterior a hoje.';
  } else {
    if (!value('pj.cnpj')) errors['pj.cnpj'] = 'O CNPJ é obrigatório.';
    else if (!hasValidCnpj(value('pj.cnpj'))) errors['pj.cnpj'] = 'Informe um CNPJ válido.';
    if (!value('pj.razao_social')) errors['pj.razao_social'] = 'A razão social é obrigatória.';
    if (!value('pj.nome_responsavel')) errors['pj.nome_responsavel'] = 'Informe o responsável pela empresa.';
    if (!value(cpf)) errors[cpf] = 'O CPF do responsável é obrigatório.';
    else if (!hasValidCpf(value(cpf))) errors[cpf] = 'Informe um CPF válido.';
  }
  const limits: Record<string, number> = {
    'pj.razao_social': 255, 'pj.nome_fantasia': 255, 'pj.nome_responsavel': 255,
    'endereco.logradouro': 255, 'endereco.numero': 20, 'endereco.complemento': 100,
    'endereco.bairro': 100, 'endereco.cidade': 100,
  };
  Object.entries(limits).forEach(([field, max]) => {
    const fieldValue = value(field);
    if (fieldValue.length > max) errors[field] = `Use até ${max} caracteres.`;
  });
  const cep = onlyDigits(value('endereco.cep'), 9);
  if (value('endereco.cep') && cep.length !== 8) errors['endereco.cep'] = 'Informe o CEP com 8 dígitos.';
  if (value('endereco.estado') && !/^[A-Za-z]{2}$/.test(value('endereco.estado'))) errors['endereco.estado'] = 'Informe a UF com 2 letras.';
  return errors;
}

const emptyClient = (): ClientData => ({
  nome: '', tipo: 'pf', email: '', telefone: '',
  pf: { genero: '', rg: '', cpf: '', data_nascimento: '' },
  pj: { cnpj: '', razao_social: '', nome_fantasia: '', nome_responsavel: '', cpf_responsavel: '', cargo_responsavel: '' },
  endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' },
});

function unwrapClient(payload: unknown): ClientData {
  let current = payload as ClientData;
  for (let index = 0; index < 5 && current?.data && !Array.isArray(current.data); index++) current = current.data;
  return current ?? {};
}

function normalizeClient(client: ClientData): ClientData {
  const blank = emptyClient();
  return {
    ...blank,
    ...client,
    telefone: client.telefone ? formatPhone(String(client.telefone)) : '',
    pf: { ...blank.pf, ...(client.pf ?? {}), cpf: client.pf?.cpf ? formatCpf(String(client.pf.cpf)) : '', rg: client.pf?.rg ? formatRg(String(client.pf.rg)) : '', data_nascimento: String(client.pf?.data_nascimento ?? '').slice(0, 10) },
    pj: { ...blank.pj, ...(client.pj ?? {}), cnpj: client.pj?.cnpj ? formatCnpj(String(client.pj.cnpj)) : '', cpf_responsavel: client.pj?.cpf_responsavel ? formatCpf(String(client.pj.cpf_responsavel)) : '' },
    endereco: { ...blank.endereco, ...(client.endereco ?? {}), cep: client.endereco?.cep ? formatCep(String(client.endereco.cep)) : '', estado: String(client.endereco?.estado ?? '').toUpperCase() },
  };
}

function clientPayload(form: ClientData) {
  const payload = { ...form, pf: { ...(form.pf ?? {}) }, pj: { ...(form.pj ?? {}) }, endereco: { ...(form.endereco ?? {}) } };
  payload.email = payload.email || null;
  payload.telefone = payload.telefone || null;
  if (payload.tipo === 'pf') delete payload.pj;
  else delete payload.pf;
  payload.endereco = Object.fromEntries(Object.entries(payload.endereco ?? {}).filter(([, value]) => value !== '' && value !== null && value !== undefined));
  return payload;
}

function toMultipart(payload: ClientData, avatar: File) {
  const data = new FormData();
  data.append('avatar', avatar);
  ['nome', 'tipo', 'email', 'telefone'].forEach((key) => {
    if (payload[key] !== null && payload[key] !== undefined) data.append(key, String(payload[key]));
  });
  ['pf', 'pj', 'endereco'].forEach((group) => {
    Object.entries(payload[group] ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') data.append(`${group}[${key}]`, String(value));
    });
  });
  return data;
}

export function ClientEditorPage({ clientId }: { clientId?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEdit = !!clientId;
  const [form, setForm] = useState<ClientData>(emptyClient);
  const [originalForm, setOriginalForm] = useState<ClientData>(emptyClient);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'found' | 'not-found' | 'error'>('idle');
  const cepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cepRequest = useRef<AbortController | null>(null);
  const cepRequestId = useRef(0);
  const lastCepRequested = useRef('');

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  useEffect(() => {
    if (!clientId) return;
    let active = true;
    apiFetch<unknown>(`/clientes/${clientId}`)
      .then((payload) => { if (active) { const client = normalizeClient(unwrapClient(payload)); setForm(client); setOriginalForm(client); } })
      .catch((reason) => { if (active) showToast(reason instanceof Error ? reason.message : 'Não foi possível carregar os dados do cliente.', 'error'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [clientId, showToast]);

  useEffect(() => () => {
    if (cepTimer.current) clearTimeout(cepTimer.current);
    cepRequest.current?.abort();
  }, []);

  const validationErrors = useMemo(() => {
    const errors = validateClient(form);
    if (cepStatus === 'not-found') errors['endereco.cep'] = 'CEP não encontrado. Corrija ou remova o CEP.';
    return errors;
  }, [cepStatus, form]);
  const visibleErrors = useMemo(() => Object.fromEntries(Object.entries(validationErrors).filter(([field]) => touched[field])), [touched, validationErrors]);
  const formChanged = JSON.stringify(form) !== JSON.stringify(originalForm);
  const avatarChanged = !!avatarFile || removeAvatar;
  const isDirty = formChanged || avatarChanged;
  const canSave = Object.keys(validationErrors).length === 0 && !avatarError && cepStatus !== 'loading' && (!isEdit || formChanged || avatarChanged);
  const { requestNavigation, navigateWithoutConfirmation, dialog } = useUnsavedChangesGuard(isDirty);

  function change(name: string, value: string) {
    let formatted = value;
    if (name === 'telefone') formatted = formatPhone(value);
    else if (name === 'pf.cpf' || name === 'pj.cpf_responsavel') formatted = formatCpf(value);
    else if (name === 'pj.cnpj') formatted = formatCnpj(value);
    else if (name === 'pf.rg') formatted = formatRg(value);
    else if (name === 'endereco.cep') formatted = formatCep(value);
    else if (name === 'endereco.estado') formatted = value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2);
    if (name === 'endereco.cep') {
      if (cepTimer.current) clearTimeout(cepTimer.current);
      cepRequest.current?.abort();
      cepRequestId.current += 1;
      const requestId = cepRequestId.current;
      const cep = onlyDigits(formatted, 8);
      if (cep.length < 8) {
        setCepStatus('idle');
      } else if (cep !== lastCepRequested.current || cepStatus !== 'found') {
        setCepStatus('loading');
        lastCepRequested.current = cep;
        cepTimer.current = setTimeout(async () => {
          const controller = new AbortController();
          cepRequest.current = controller;
          try {
            const address = await getCepAddress(cep, controller.signal);
            if (requestId !== cepRequestId.current) return;
            setForm((current) => ({
              ...current,
              endereco: {
                ...(current.endereco ?? {}),
                logradouro: address.logradouro ?? '',
                complemento: address.complemento ?? '',
                bairro: address.bairro ?? '',
                cidade: address.localidade ?? '',
                estado: address.uf ?? '',
              },
            }));
            setCepStatus('found');
          } catch (reason) {
            if (controller.signal.aborted || requestId !== cepRequestId.current) return;
            const notFound = reason instanceof Error && reason.message === 'CEP não encontrado.';
            setCepStatus(notFound ? 'not-found' : 'error');
            showToast(notFound ? 'CEP não encontrado. Confira os números.' : 'Não foi possível consultar o CEP. Preencha o endereço manualmente.', notFound ? 'warning' : 'error');
          }
        }, 250);
      }
    }
    setForm((current) => {
      if (!name.includes('.')) return { ...current, [name]: formatted };
      const [group, key] = name.split('.');
      return { ...current, [group]: { ...(current[group] ?? {}), [key]: formatted } };
    });
  }

  function blur(name: string) { setTouched((current) => ({ ...current, [name]: true })); }

  function selectAvatar(file: File | null) {
    setError('');
    if (!file) { setAvatarFile(null); setAvatarError(''); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Escolha uma imagem JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('A imagem do avatar não pode ultrapassar 2 MB.');
      return;
    }
    setAvatarError('');
    setRemoveAvatar(false);
    setAvatarFile(file);
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) {
      setTouched(Object.fromEntries(Object.keys(validationErrors).map((field) => [field, true])));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = clientPayload(form);
      if (payload.pf?.cpf) payload.pf.cpf = onlyDigits(payload.pf.cpf, 11);
      if (payload.pj?.cnpj) payload.pj.cnpj = onlyDigits(payload.pj.cnpj, 14);
      if (payload.pj?.cpf_responsavel) payload.pj.cpf_responsavel = onlyDigits(payload.pj.cpf_responsavel, 11);
      if (payload.pf?.rg) payload.pf.rg = payload.pf.rg.replace(/[^0-9x]/gi, '').toUpperCase();
      if (payload.telefone) payload.telefone = onlyDigits(payload.telefone, 11);
      if (payload.endereco?.cep) payload.endereco.cep = onlyDigits(payload.endereco.cep, 8);
      if (payload.endereco?.estado) payload.endereco.estado = payload.endereco.estado.toUpperCase();
      if (isEdit) {
        await apiFetch(`/clientes/${clientId}`, { method: 'PUT', body: JSON.stringify(payload) });
        if (avatarFile) {
          const data = new FormData();
          data.append('avatar', avatarFile);
          await apiFetch(`/clientes/${clientId}/imagem`, { method: 'POST', body: data });
        } else if (removeAvatar) {
          await apiFetch(`/clientes/${clientId}/imagem`, { method: 'DELETE' });
        }
      } else {
        await apiFetch('/clientes', {
          method: 'POST',
          body: avatarFile ? toMultipart(payload, avatarFile) : JSON.stringify(payload),
        });
      }
      showToast(isEdit ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.', 'success');
      navigateWithoutConfirmation(() => router.push('/clientes'));
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : 'Não foi possível salvar o cadastro.', 'error');
    } finally {
      setSaving(false);
    }
  }

  const currentAvatar = removeAvatar ? null : avatarPreview ?? form.avatar_url ?? form.avatar ?? null;

  return <main className={styles.page}>
    <header className={styles.pageHeader}>
      <button type="button" className={styles.backButton} onClick={() => requestNavigation(() => router.push('/clientes'))}><Icon icon="mdi:arrow-left" width={23} height={23} />Voltar para clientes</button>
      <div className={styles.titleActions}>
        <div className={styles.titleCopy}>
          <span className={styles.eyebrow}><Icon icon="mdi:account-group-outline" width={18} height={18} />CADASTRO · RELACIONAMENTO</span>
          <h1>{isEdit ? 'Editar cliente' : 'Novo cliente'}</h1>
          <p>{isEdit ? 'Atualize os dados de identificação, contato e endereço.' : 'Preencha os dados para incluir uma pessoa física ou jurídica na organização.'}</p>
        </div>
        <button type="submit" form="client-editor-form" className={styles.saveButton} disabled={saving || loading || !canSave}>{saving ? <><span className={styles.buttonSpinner} />Salvando…</> : <><Icon icon="mdi:content-save-outline" width={21} height={21} />Salvar cliente</>}</button>
      </div>
    </header>

    {(error || avatarError) && <div className={styles.error} role="alert"><Icon icon="mdi:alert-circle-outline" width={20} height={20} />{avatarError || error}</div>}
    {loading ? <div className={styles.loading}><span className="spinner" />Carregando dados do cliente…</div> : <form id="client-editor-form" className={styles.form} onSubmit={submit}>
      <ClientEditorFields form={form} onChange={change} errors={visibleErrors} onBlur={blur} cepStatus={cepStatus} avatarUrl={currentAvatar} onAvatarChange={selectAvatar} onRemoveAvatar={() => { setAvatarFile(null); setAvatarError(''); setRemoveAvatar(true); }} canRemoveAvatar={!!form.avatar_url && !avatarFile && !removeAvatar} />
      <footer className={styles.actions}>
        <span>{avatarError ? 'Corrija o arquivo do avatar antes de salvar.' : isEdit ? (formChanged || avatarChanged ? 'Há alterações prontas para salvar.' : 'Altere algum dado ou a imagem para habilitar o salvamento.') : 'Preencha os campos obrigatórios e válidos para salvar.'}</span>
      </footer>
    </form>}
    {dialog}
  </main>;
}

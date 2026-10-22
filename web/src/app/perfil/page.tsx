'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

type Profile = { id?: string; name?: string; email?: string; role?: string; avatar_url?: string | null; funcionario?: { telefone?: string | null; cpf?: string | null; data_nascimento?: string | null; endereco?: Record<string, string | null> | null } | null };
type Form = { name: string; email: string; telefone: string; cpf: string; data_nascimento: string; cep: string; logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string; password: string; password_confirmation: string };
const emptyForm: Form = { name: '', email: '', telefone: '', cpf: '', data_nascimento: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', password: '', password_confirmation: '' };
const digits = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max);
const formatPhone = (value: string) => { const v = digits(value, 11); return v.length > 10 ? v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3') : v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3'); };
const formatCpf = (value: string) => digits(value, 11).replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, '$1.$2.$3-$4');
const formatCep = (value: string) => digits(value, 8).replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
function dateValue(value?: string | null) { if (!value) return ''; const date = value.slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ''; }
function profileFrom(payload: unknown): Profile {
  let value = payload as { data?: unknown };
  for (let i = 0; i < 3 && value && !('id' in value); i++) value = value.data as typeof value;
  return value as Profile;
}
function toForm(profile: Profile): Form {
  const employee = profile.funcionario;
  const address = employee?.endereco ?? {};
  return { ...emptyForm, name: profile.name ?? '', email: profile.email ?? '', telefone: employee?.telefone ? formatPhone(employee.telefone) : '', cpf: employee?.cpf ? formatCpf(employee.cpf) : '', data_nascimento: dateValue(employee?.data_nascimento), cep: address.cep ? formatCep(address.cep) : '', logradouro: address.logradouro ?? '', numero: address.numero ?? '', complemento: address.complemento ?? '', bairro: address.bairro ?? '', cidade: address.cidade ?? '', estado: address.estado ?? '' };
}
function profileRole(role?: string) { return ({ admin: 'Administrador', gestor: 'Gestor', funcionario: 'Funcionário' } as Record<string, string>)[role ?? ''] ?? 'Usuário'; }

function ProfileContent() {
  const { updateUser } = useAuth();
  const [form, setForm] = useState<Form>(emptyForm);
  const [initial, setInitial] = useState<Form>(emptyForm);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const changed = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  useEffect(() => {
    apiFetch<unknown>('/me').then((payload) => {
      const current = profileFrom(payload);
      const values = toForm(current);
      setProfile(current); setForm(values); setInitial(values);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o perfil.')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!changed) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [changed]);

  useEffect(() => {
    if (!changed) return;
    const guardNavigation = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank') return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
      if (!window.confirm('As alterações do perfil não foram salvas. Deseja sair e descartar as alterações?')) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    document.addEventListener('click', guardNavigation, true);
    return () => document.removeEventListener('click', guardNavigation, true);
  }, [changed]);

  const update = (key: keyof Form, event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const value = key === 'telefone' ? formatPhone(raw) : key === 'cpf' ? formatCpf(raw) : key === 'cep' ? formatCep(raw) : key === 'estado' ? raw.toUpperCase().slice(0, 2) : raw;
    setForm((current) => ({ ...current, [key]: value }));
    setError(''); setSuccess('');
  };

  async function save(event: FormEvent) {
    event.preventDefault(); setError(''); setSuccess('');
    if (form.name.trim().length < 2) { setError('Informe seu nome completo.'); return; }
    if (form.password && form.password.length < 8) { setError('A nova senha deve ter pelo menos 8 caracteres.'); return; }
    if (form.password && form.password !== form.password_confirmation) { setError('A confirmação da senha não corresponde.'); return; }
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: form.name.trim(), email: form.email.trim(),
      funcionario: { telefone: digits(form.telefone, 11) || null, data_nascimento: form.data_nascimento || null, ...(digits(form.cpf, 11) ? { cpf: digits(form.cpf, 11) } : {}) },
      endereco: { cep: digits(form.cep, 8), logradouro: form.logradouro.trim(), numero: form.numero.trim(), complemento: form.complemento.trim() || null, bairro: form.bairro.trim(), cidade: form.cidade.trim(), estado: form.estado.trim().toUpperCase() },
    };
    if (form.password) payload.password = form.password;
    try {
      const response = await apiFetch<unknown>('/me', { method: 'PUT', body: JSON.stringify(payload) });
      const updated = profileFrom(response);
      const values = toForm(updated);
      setProfile(updated); setForm(values); setInitial(values);
      updateUser({ name: updated.name ?? '', email: updated.email ?? '', role: updated.role });
      setSuccess('Seus dados foram atualizados.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Confira os dados e tente novamente.'); }
    finally { setSaving(false); }
  }

  const fields: Array<{ key: keyof Form; label: string; type?: string; placeholder?: string }> = [
    { key: 'name', label: 'Nome completo', placeholder: 'Seu nome' },
    { key: 'email', label: 'E-mail', type: 'email', placeholder: 'voce@empresa.com' },
    { key: 'telefone', label: 'Telefone', placeholder: '(00) 00000-0000' },
    { key: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
    { key: 'data_nascimento', label: 'Data de nascimento', type: 'date' },
    { key: 'cep', label: 'CEP', placeholder: '00000-000' },
    { key: 'logradouro', label: 'Logradouro' },
    { key: 'numero', label: 'Número' },
    { key: 'complemento', label: 'Complemento' },
    { key: 'bairro', label: 'Bairro' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'estado', label: 'Estado (UF)', placeholder: 'UF' },
  ];

  return <>
    <div className="page-heading"><div><span className="eyebrow">CONTA</span><h1>Meu perfil</h1><p>Visualize e atualize seus dados pessoais.</p></div><span className="role-pill profile-role">{profileRole(profile?.role)}</span></div>
    {loading ? <div className="data-panel table-loading"><span className="spinner" />Carregando seus dados…</div> : <form className="profile-form" onSubmit={save}>
      <section className="profile-identity-card"><div className="profile-avatar-large">{(profile?.name ?? 'U').trim().split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div><div><span className="eyebrow">PERFIL DE ACESSO</span><h2>{profile?.name ?? 'Usuário'}</h2><p>{profile?.email ?? ''}</p></div><span className="role-pill">{profileRole(profile?.role)}</span></section>
      <section className="profile-section"><div className="profile-section-heading"><span className="eyebrow">INFORMAÇÕES</span><h2>Dados da conta e pessoais</h2></div><div className="profile-fields">{fields.slice(0, 5).map((field) => <label className="editor-field" key={field.key}><span>{field.label}</span><input type={field.type ?? 'text'} value={form[field.key]} onChange={(event) => update(field.key, event)} placeholder={field.placeholder ?? 'Não informado'} /></label>)}</div></section>
      <section className="profile-section"><div className="profile-section-heading"><span className="eyebrow">LOCALIZAÇÃO</span><h2>Endereço</h2><p>Campos vazios também podem ser preenchidos.</p></div><div className="profile-fields">{fields.slice(5).map((field) => <label className="editor-field" key={field.key}><span>{field.label}</span><input type={field.type ?? 'text'} value={form[field.key]} onChange={(event) => update(field.key, event)} placeholder={field.placeholder ?? 'Não informado'} /></label>)}</div></section>
      <section className="profile-section"><div className="profile-section-heading"><span className="eyebrow">SEGURANÇA</span><h2>Alterar senha</h2><p>A senha atual não é exibida. Deixe os campos vazios para mantê-la.</p></div><div className="profile-fields"><label className="editor-field"><span>Nova senha</span><input type="password" autoComplete="new-password" value={form.password} onChange={(event) => update('password', event)} placeholder="Mínimo de 8 caracteres" /></label><label className="editor-field"><span>Confirme a nova senha</span><input type="password" autoComplete="new-password" value={form.password_confirmation} onChange={(event) => update('password_confirmation', event)} placeholder="Repita a nova senha" /></label></div></section>
      {error && <div className="inline-error profile-message">{error}</div>}{success && <div className="profile-success">✓ {success}</div>}
      <div className="profile-save-bar"><span>{changed ? 'Você tem alterações não salvas.' : 'Seus dados estão atualizados.'}</span><button className="primary-button" disabled={!changed || saving}>{saving ? 'Salvando…' : 'Salvar alterações'}<span>→</span></button></div>
    </form>}
  </>;
}

export default function ProfilePage() { return <AppShell><ProfileContent /></AppShell>; }

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from '@mui/material';
import { Icon } from '@iconify/react';
import { apiFetch, unwrap } from '@/lib/api';

type Manager = { id: string; name: string; email: string };
type Organization = { id: string; name: string; document?: string | null; email?: string | null; phone?: string | null; active: boolean; users_count: number; manager_id?: string | null; managers?: Manager[] };
type OrganizationMetrics = { organizations_total: number; organizations_active: number; organizations_inactive: number; organizations_created_this_month: number; users_total: number; users_active: number; managers_active: number; employees_active: number };
type FormState = { name: string; document: string; email: string; phone: string; manager_id: string; manager_name: string; manager_email: string; manager_password: string; manager_cpf: string };
const initialForm: FormState = { name: '', document: '', email: '', phone: '', manager_id: '', manager_name: '', manager_email: '', manager_password: '', manager_cpf: '' };
const metricCards: Array<{ key: keyof OrganizationMetrics; label: string; icon: string; color: string }> = [
  { key: 'organizations_total', label: 'Organizações', icon: 'mdi:domain', color: '#9333ea' },
  { key: 'organizations_active', label: 'Organizações ativas', icon: 'mdi:check-circle-outline', color: '#00a83b' },
  { key: 'users_total', label: 'Usuários', icon: 'mdi:account-group-outline', color: '#0ea5e9' },
  { key: 'managers_active', label: 'Gestores ativos', icon: 'mdi:account-tie-outline', color: '#f97316' },
];

export function OrganizationsAdmin() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [metrics, setMetrics] = useState<OrganizationMetrics | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Organization | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [orgPayload, metricsPayload] = await Promise.all([apiFetch<unknown>('/organizations'), apiFetch<unknown>('/organizations/metrics')]);
      setOrganizations(unwrap<Organization[]>(orgPayload as never));
      setMetrics(unwrap<OrganizationMetrics>(metricsPayload as never));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar as organizações.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return organizations.filter((organization) => {
      const manager = organization.managers?.find((item) => item.id === organization.manager_id) ?? organization.managers?.[0];
      return !term || [organization.name, organization.document, organization.email, manager?.name, manager?.email].some((value) => value?.toLocaleLowerCase('pt-BR').includes(term));
    });
  }, [organizations, search]);

  const openCreate = () => { setEditing(null); setForm(initialForm); setDialogOpen(true); setError(''); };
  const openEdit = (organization: Organization) => {
    setEditing(organization);
    setDialogOpen(true);
    setForm({ ...initialForm, name: organization.name, document: organization.document ?? '', email: organization.email ?? '', phone: organization.phone ?? '', manager_id: organization.manager_id ?? '' });
    setError('');
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(initialForm); };
  const change = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const save = async () => {
    setSaving(true); setError('');
    try {
      const organizationData = { name: form.name.trim(), document: form.document.trim() || null, email: form.email.trim() || null, phone: form.phone.trim() || null };
      if (editing) {
        await apiFetch(`/organizations/${editing.id}`, { method: 'PUT', body: JSON.stringify({ ...organizationData, manager_id: form.manager_id || null }) });
      } else {
        await apiFetch('/organizations', { method: 'POST', body: JSON.stringify({ ...organizationData, manager: { name: form.manager_name.trim(), email: form.manager_email.trim(), password: form.manager_password, cpf: form.manager_cpf.replace(/\D/g, '') } }) });
      }
      closeDialog(); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar a organização.'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (organization: Organization) => {
    setError('');
    try { await apiFetch(`/organizations/${organization.id}`, { method: 'PUT', body: JSON.stringify({ active: !organization.active }) }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar a organização.'); }
  };

  return <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box className="page-heading"><Box><Typography component="span" className="eyebrow">ADMINISTRAÇÃO GLOBAL</Typography><Typography component="h1" sx={{ mt: .5, color: 'var(--ink)', font: '800 clamp(25px,3vw,32px) Manrope,sans-serif' }}>Organizações</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 14 }}>Gerencie empresas, gestores e o acesso ao sistema.</Typography></Box><Button variant="contained" startIcon={<Icon icon="mdi:plus" />} onClick={openCreate} sx={{ minHeight: 48, borderRadius: 2, px: 2.5, fontWeight: 700, textTransform: 'none', bgcolor: '#005CE4' }}>Nova organização</Button></Box>
    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 1.5 }}>
      {metricCards.map((metric) => <Card key={metric.key} sx={{ border: '1px solid var(--line)', borderRadius: 3, bgcolor: 'var(--card)', color: 'var(--ink)', boxShadow: 'none' }}><CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, '&:last-child': { pb: 2 } }}><Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: `${metric.color}18`, color: metric.color }}><Icon icon={metric.icon} width={23} /></Box><Box><Typography sx={{ color: 'var(--muted)', fontSize: 12 }}>{metric.label}</Typography><Typography sx={{ font: '800 23px Manrope,sans-serif' }}>{metrics?.[metric.key] ?? (loading ? '—' : 0)}</Typography></Box></CardContent></Card>)}
    </Box>
    <Card sx={{ border: '1px solid var(--line)', borderRadius: 3, bgcolor: 'var(--card)', color: 'var(--ink)', boxShadow: 'none' }}>
      <CardContent sx={{ pb: 1.5 }}><Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}><TextField size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar organização ou gestor" slotProps={{ htmlInput: { 'aria-label': 'Buscar organização ou gestor' } }} sx={{ width: { xs: '100%', sm: 390 }, '& .MuiOutlinedInput-root': { color: 'var(--ink)', bgcolor: 'var(--surface)' } }} /><Typography sx={{ color: 'var(--muted)', fontSize: 12 }}>{filtered.length} de {organizations.length} organizações</Typography></Box></CardContent>
      {loading ? <Typography sx={{ p: 3, color: 'var(--muted)' }}>Carregando organizações…</Typography> : filtered.length === 0 ? <Typography sx={{ p: 3, color: 'var(--muted)', textAlign: 'center' }}>{search ? 'Nenhuma organização encontrada.' : 'Nenhuma organização cadastrada.'}</Typography> : <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,330px),1fr))', gap: 1.5, p: 2, pt: 0 }}>
        {filtered.map((organization) => { const manager = organization.managers?.find((item) => item.id === organization.manager_id) ?? organization.managers?.[0]; return <Card key={organization.id} variant="outlined" sx={{ borderColor: 'var(--line)', borderRadius: 2.5, bgcolor: 'var(--surface)' }}><CardContent sx={{ '&:last-child': { pb: 2 } }}><Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}><Box sx={{ width: 46, height: 46, flex: '0 0 auto', display: 'grid', placeItems: 'center', borderRadius: 2, bgcolor: '#005CE418', color: '#005CE4' }}><Icon icon="mdi:domain" width={24} /></Box><Box sx={{ flex: 1, minWidth: 0 }}><Typography noWrap sx={{ color: 'var(--ink)', fontWeight: 800, fontSize: 16 }}>{organization.name}</Typography><Typography sx={{ color: 'var(--muted)', fontSize: 12, mt: .35 }}>{organization.document || 'Sem CNPJ'} · {organization.users_count ?? 0} usuário(s)</Typography><Typography noWrap sx={{ color: 'var(--muted)', fontSize: 12, mt: .75 }}><Icon icon="mdi:account-tie-outline" style={{ verticalAlign: 'middle', marginRight: 5 }} />{manager?.name ?? 'Gestor não cadastrado'}</Typography></Box><Chip size="small" label={organization.active ? 'Ativa' : 'Inativa'} color={organization.active ? 'success' : 'error'} variant="outlined" /></Box><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1.25, borderTop: '1px solid var(--line)' }}><Button size="small" onClick={() => openEdit(organization)} startIcon={<Icon icon="mdi:pencil-outline" />} sx={{ textTransform: 'none', fontWeight: 700 }}>Editar</Button><Button size="small" color={organization.active ? 'warning' : 'success'} onClick={() => void toggleActive(organization)} startIcon={<Icon icon={organization.active ? 'mdi:pause-circle-outline' : 'mdi:play-circle-outline'} />} sx={{ textTransform: 'none', fontWeight: 700 }}>{organization.active ? 'Desativar' : 'Ativar'}</Button></Box></CardContent></Card>; })}
      </Box>}
    </Card>
    <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { bgcolor: 'var(--card)', color: 'var(--ink)', borderRadius: 3 } } }}>
      <DialogTitle>{editing ? 'Editar organização' : 'Nova organização'}</DialogTitle>
      <DialogContent sx={{ '& .MuiInputBase-root': { color: 'var(--ink)' }, '& .MuiInputLabel-root': { color: 'var(--muted)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--line)' }, '& .MuiSvgIcon-root': { color: 'var(--muted)' } }}><Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}><TextField required label="Nome da organização" value={form.name} onChange={change('name')} /><TextField label="CNPJ" value={form.document} onChange={change('document')} /><TextField label="E-mail" type="email" value={form.email} onChange={change('email')} /><TextField label="Telefone" value={form.phone} onChange={change('phone')} />{editing ? <TextField select label="Gestor responsável" value={form.manager_id} onChange={change('manager_id')}><MenuItem value="">Sem gestor selecionado</MenuItem>{(editing.managers ?? []).map((manager) => <MenuItem value={manager.id} key={manager.id}>{manager.name} · {manager.email}</MenuItem>)}</TextField> : <><Typography sx={{ pt: 1, fontSize: 14, fontWeight: 800 }}>Acesso do gestor inicial</Typography><TextField required label="Nome do gestor" value={form.manager_name} onChange={change('manager_name')} /><TextField required label="E-mail de acesso" type="email" value={form.manager_email} onChange={change('manager_email')} /><TextField required label="CPF do gestor" value={form.manager_cpf} onChange={change('manager_cpf')} /><TextField required label="Senha inicial (mínimo 8 caracteres)" type="password" value={form.manager_password} onChange={change('manager_password')} /><Typography sx={{ color: 'var(--muted)', fontSize: 12 }}>O gestor será vinculado somente a esta organização e precisará trocar a senha no primeiro acesso.</Typography></>}</Box></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={closeDialog} sx={{ textTransform: 'none' }}>Cancelar</Button><Button variant="contained" disabled={saving || !form.name.trim()} onClick={() => void save()} sx={{ bgcolor: '#005CE4', textTransform: 'none', fontWeight: 700 }}>{saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar organização'}</Button></DialogActions>
    </Dialog>
  </Box>;
}

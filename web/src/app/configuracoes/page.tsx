'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

function SettingsContent() {
  const { user, signOut } = useAuth();
  const { mode, toggle, compactLists, setCompactLists } = useTheme();
  const [notifications, setNotifications] = useState(true);
  useEffect(() => { setNotifications(window.localStorage.getItem('gestorize-notifications') !== 'false'); }, []);
  const changeNotifications = (value: boolean) => { setNotifications(value); window.localStorage.setItem('gestorize-notifications', String(value)); };
  const initials = (user?.name ?? 'U').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return <>
    <div className="page-heading"><div><span className="eyebrow">PREFERÊNCIAS</span><h1>Configurações</h1><p>Gerencie sua conta e a aparência do Gestorize neste navegador.</p></div></div>
    <section className="settings-profile-card"><div className="settings-avatar">{initials}</div><div className="settings-account"><span className="eyebrow">CONTA ATIVA</span><strong>{user?.name}</strong><span>{user?.email}</span></div><span className="role-pill">{user?.role ?? 'Usuário'}</span><Link className="secondary-button" href="/perfil">Ver perfil <span>↗</span></Link></section>
    <section className="settings-section"><div className="settings-section-title"><span className="settings-section-icon">◉</span><div><h2>Sistema</h2><p>Preferências e informações da conta.</p></div></div>
      <Link className="setting-row" href="/perfil"><span className="setting-icon">♙</span><span className="setting-copy"><strong>Meu perfil</strong><small>Atualize seus dados pessoais, endereço e senha.</small></span><span className="setting-arrow">›</span></Link>
      <SettingToggle icon="♧" title="Notificações" description={notifications ? 'Alertas habilitados neste navegador' : 'Alertas pausados neste navegador'} checked={notifications} onChange={changeNotifications} />
    </section>
    <section className="settings-section"><div className="settings-section-title"><span className="settings-section-icon">◐</span><div><h2>Aparência</h2><p>Ajuste a apresentação para sua preferência.</p></div></div>
      <SettingToggle icon="☾" title="Tema escuro" description={mode === 'dark' ? 'Ativado' : 'Desativado'} checked={mode === 'dark'} onChange={() => toggle()} />
      <SettingToggle icon="☷" title="Listas compactas" description={compactLists ? 'Linhas mais baixas e mais registros na tela' : 'Espaçamento padrão nas listagens'} checked={compactLists} onChange={setCompactLists} />
    </section>
    <section className="settings-section"><div className="settings-section-title"><span className="settings-section-icon">⌁</span><div><h2>Sessão</h2><p>A sessão encerra automaticamente após três horas.</p></div></div>
      <button className="setting-row setting-danger" onClick={() => void signOut()}><span className="setting-icon">↪</span><span className="setting-copy"><strong>Sair da conta</strong><small>Encerrar o acesso neste navegador.</small></span><span className="setting-arrow">›</span></button>
    </section>
  </>;
}

function SettingToggle({ icon, title, description, checked, onChange }: { icon: string; title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="setting-row"><span className="setting-icon">{icon}</span><span className="setting-copy"><strong>{title}</strong><small>{description}</small></span><input className="switch-input" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="switch-track" aria-hidden="true"><span /></span></label>;
}

export default function SettingsPage() { return <AppShell><SettingsContent /></AppShell>; }

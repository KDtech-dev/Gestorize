'use client';

import { FormEvent, useState } from 'react';
import { useAuth, type WebUser } from '@/context/AuthContext';
import { apiFetch, unwrap } from '@/lib/api';

export default function FirstAccessPasswordPage() {
  const { user, updateUser, signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password.length < 8) return setError('A nova senha deve ter pelo menos 8 caracteres.');
    if (password !== confirmation) return setError('As senhas não coincidem.');
    if (password === currentPassword) return setError('Escolha uma senha diferente da senha inicial.');

    setSaving(true);
    try {
      const response = await apiFetch<unknown>('/primeiro-acesso/alterar-senha', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, password, password_confirmation: confirmation }),
      });
      updateUser(unwrap<WebUser>(response as never));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar sua senha.');
    } finally {
      setSaving(false);
    }
  }

  return <main className="login-page">
    <section className="login-form-wrap">
      <form className="login-card" onSubmit={submit}>
        <span className="eyebrow">PRIMEIRO ACESSO</span>
        <h2>Proteja sua conta</h2>
        <p className="muted">Olá, {user?.name}. Troque a senha inicial para acessar os dados da sua organização.</p>
        <div className="field login-field"><label htmlFor="current-password">Senha inicial</label><input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></div>
        <div className="field login-field"><label htmlFor="new-password">Nova senha</label><input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        <div className="field login-field"><label htmlFor="confirm-password">Confirme a nova senha</label><input id="confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button login-submit" disabled={saving}>{saving ? 'Atualizando…' : 'Salvar nova senha'}</button>
        <button className="secondary-button" type="button" onClick={() => void signOut()}>Sair da conta</button>
      </form>
    </section>
  </main>;
}

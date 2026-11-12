'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { useAuth, type WebUser } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiFetch, unwrap } from '@/lib/api';
import { LoginInput } from '@/components/LoginInput';

export default function FirstAccessPasswordPage() {
  const { user, updateUser, signOut } = useAuth();
  const { mode, toggle } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('A nova senha deve ter pelo menos 8 caracteres.');
    }

    if (password !== confirmation) {
      return setError('As senhas não coincidem.');
    }

    if (password === currentPassword) {
      return setError('Escolha uma senha diferente da senha inicial.');
    }

    setSaving(true);

    try {
      const response = await apiFetch<unknown>('/primeiro-acesso/alterar-senha', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          password,
          password_confirmation: confirmation,
        }),
      });

      updateUser(unwrap<WebUser>(response as never));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar sua senha.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="login-page">
      <button
        type="button"
        className="login-mobile-theme"
        onClick={toggle}
        aria-label={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      >
        <span aria-hidden>{mode === 'dark' ? '☀' : '☾'}</span>
        {mode === 'dark' ? 'Claro' : 'Escuro'}
      </button>

      <header className="login-mobile-header">
        <Image
          src={mode === 'dark' ? '/images/Logo.png' : '/images/LogoLight.png'}
          alt="Gestorize"
          width={170}
          height={145}
          priority
        />
        <h1>Gestorize</h1>
        <p>O seu sistema de gestão empresarial</p>
      </header>

      {/* Painel institucional à direita */}
      <section className="login-aside login-aside-right">
        <div className="brand brand-light">
          <Image
            src="/images/LogoLight.png"
            alt="Gestorize"
            width={64}
            height={56}
            priority
          />
          <span>Gestorize</span>
        </div>

        <div className="login-pitch">
          <span className="eyebrow">SUA CONTA, SUA SEGURANÇA</span>
          <h1>Um novo começo para organizar e proteger seu negócio.</h1>
          <p>
            Antes de continuar, defina uma senha pessoal e segura para
            acessar sua organização.
          </p>
        </div>

        <div className="aside-bottom">
          Uma experiência integrada ao aplicativo Gestorize.
        </div>
      </section>

      {/* Formulário à esquerda */}
      <section className="login-form-wrap">
        <form className="login-card" onSubmit={submit}>
          <div className="mobile-brand brand">
            <Image
              src={mode === 'dark' ? '/images/LogoLight.png' : '/images/Logo.png'}
              alt="Gestorize"
              width={58}
              height={50}
            />
            <span>Gestorize</span>
          </div>

          <span className="eyebrow">PRIMEIRO ACESSO</span>
          <h2>Proteja sua conta</h2>
          <p className="muted">
            Olá, {user?.name}. Troque sua senha inicial para acessar os dados
            da sua organização.
          </p>

          <div className="field login-field">
            <label htmlFor="current-password">Senha inicial</label>
            <LoginInput
              id="current-password"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha inicial"
              value={currentPassword}
              onChange={setCurrentPassword}
            />
          </div>

          <div className="field login-field">
            <label htmlFor="new-password">Nova senha</label>
            <LoginInput
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="Digite sua nova senha"
              value={password}
              onChange={setPassword}
            />
          </div>

          <div className="field login-field">
            <label htmlFor="confirm-password">Confirme a nova senha</label>
            <LoginInput
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Confirme sua nova senha"
              value={confirmation}
              onChange={setConfirmation}
            />
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <button
            className="primary-button login-submit"
            disabled={saving}
          >
            {saving ? 'Atualizando…' : 'Salvar nova senha'}
            <span aria-hidden>→</span>
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={() => void signOut()}
          >
            Sair da conta
          </button>
        </form>
      </section>
    </main>
  );
}
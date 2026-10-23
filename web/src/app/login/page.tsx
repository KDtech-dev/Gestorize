'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Image from 'next/image';
import Link from 'next/link';
import { LoginInput } from '@/components/LoginInput';

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const { mode, toggle } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (!loading && user) router.replace('/'); }, [loading, router, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try { await signIn(email, password, remember); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível entrar.'); }
    finally { setSubmitting(false); }
  }

  return <main className="login-page">
    <section className="login-aside">
      <div className="brand brand-light"><Image src="/images/LogoLight.png" alt="Gestorize" width={64} height={56} priority /><span>Gestorize</span></div>
      <div className="login-pitch"><span className="eyebrow">GESTÃO DO SEU NEGÓCIO</span><h1>Mais clareza para cuidar de cada parte da sua operação.</h1><p>Clientes, produtos, orçamentos e vendas em um só lugar.</p></div>
      <div className="aside-bottom">Uma experiência integrada ao aplicativo Gestorize.</div>
    </section>
    <section className="login-form-wrap"><button className="theme-toggle login-theme-toggle" onClick={toggle} aria-label={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} title={mode === 'dark' ? 'Tema claro' : 'Tema escuro'}>{mode === 'dark' ? '☀' : '☾'}</button><form className="login-card" onSubmit={submit}>
      <div className="mobile-brand brand"><Image src={mode === 'dark' ? '/images/LogoLight.png' : '/images/Logo.png'} alt="Gestorize" width={58} height={50} /><span>Gestorize</span></div>
      <span className="eyebrow">BEM-VINDO DE VOLTA</span><h2>Acesse sua conta</h2><p className="muted">Entre com as credenciais usadas no aplicativo.</p>
      <div className="field login-field"><label htmlFor="login-email">E-mail</label><LoginInput id="login-email" type="email" autoComplete="username" value={email} onChange={setEmail} placeholder="seu@email.com" /></div>
      <div className="field login-field"><label htmlFor="login-password">Senha</label><LoginInput id="login-password" type="password" autoComplete="current-password" value={password} onChange={setPassword} placeholder="Digite sua senha" /></div>
      <div className="login-options">
        <label className="remember-option"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Lembre de mim</span></label>
        <Link href="/ajuda">Esqueceu a senha?</Link>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary-button login-submit" disabled={submitting}>{submitting ? 'Entrando…' : 'Entrar'}<span aria-hidden>→</span></button>
    </form></section>
  </main>;
}

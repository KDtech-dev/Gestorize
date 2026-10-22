'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (!loading && user) router.replace('/'); }, [loading, router, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try { await signIn(email, password); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível entrar.'); }
    finally { setSubmitting(false); }
  }

  return <main className="login-page">
    <section className="login-aside">
      <div className="brand brand-light"><span className="brand-mark">G</span><span>gestorize</span></div>
      <div className="login-pitch"><span className="eyebrow">GESTÃO DO SEU NEGÓCIO</span><h1>Mais clareza para cuidar de cada parte da sua operação.</h1><p>Clientes, produtos, orçamentos e vendas em um só lugar.</p></div>
      <div className="aside-bottom">Uma experiência integrada ao aplicativo Gestorize.</div>
    </section>
    <section className="login-form-wrap"><form className="login-card" onSubmit={submit}>
      <div className="mobile-brand brand"><span className="brand-mark">G</span><span>gestorize</span></div>
      <span className="eyebrow">BEM-VINDO DE VOLTA</span><h2>Acesse sua conta</h2><p className="muted">Entre com as credenciais usadas no aplicativo.</p>
      <label className="field"><span>E-mail</span><input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@empresa.com" required /></label>
      <label className="field"><span>Senha</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" required /></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="primary-button login-submit" disabled={submitting}>{submitting ? 'Entrando…' : 'Entrar'}<span aria-hidden>→</span></button>
      <div className="session-note"><span className="status-dot" />Sua sessão será encerrada após 3 horas.</div>
    </form></section>
  </main>;
}

'use client';

import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { SalesDesk } from '@/components/SalesDesk';
import { useAuth } from '@/context/AuthContext';

export default function NewModulePage() {
  const params = useParams<{ module: string }>();
  const { can, loading } = useAuth();

  if (loading) return <div className="boot-screen"><span className="spinner" />Carregando…</div>;
  if (params.module !== 'vendas' || !can('vendas.ver') || !can('vendas.criar')) {
    return <AppShell><section className="empty-state"><span className="empty-icon">⌁</span><h1>Acesso indisponível</h1><p>Seu perfil não possui acesso a esta área.</p></section></AppShell>;
  }

  return <SalesDesk />;
}

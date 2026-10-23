'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { SalesDesk } from '@/components/SalesDesk';
import { ClientEditorPage } from '@/components/entities/clients/ClientEditorPage';
import { canSell, useAuth } from '@/context/AuthContext';

function NewModuleContent() {
  const params = useParams<{ module: string }>();
  const searchParams = useSearchParams();
  const { user, loading, can } = useAuth();
  const clientId = searchParams.get('id') || undefined;

  if (loading) return <div className="boot-screen"><span className="spinner" />Carregando…</div>;
  if (params.module === 'clientes') {
    const isGlobalAdmin = user?.role === 'admin' && !user.organization_id;
    const permission = clientId ? 'clientes.editar' : 'clientes.criar';
    if (isGlobalAdmin || !can('clientes.ver') || !can(permission)) {
      return <AppShell><section className="empty-state"><span className="empty-icon">⌁</span><h1>Acesso indisponível</h1><p>Seu perfil não possui acesso a esta área.</p></section></AppShell>;
    }
    return <AppShell><ClientEditorPage clientId={clientId} /></AppShell>;
  }
  if (params.module !== 'vendas' || !canSell(user)) {
    return <AppShell><section className="empty-state"><span className="empty-icon">⌁</span><h1>Acesso indisponível</h1><p>Seu perfil não possui acesso a esta área.</p></section></AppShell>;
  }

  return <SalesDesk />;
}

export default function NewModulePage() {
  return <Suspense fallback={<div className="boot-screen"><span className="spinner" />Carregando…</div>}><NewModuleContent /></Suspense>;
}

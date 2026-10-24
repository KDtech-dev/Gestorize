'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { SalesDesk } from '@/components/SalesDesk';
import { ClientEditorPage } from '@/components/entities/clients/ClientEditorPage';
import { ProductEditorPage } from '@/components/entities/products/ProductEditorPage';
import { BusinessEditorPage } from '@/components/entities/records/BusinessEditorPage';
import { canSell, useAuth } from '@/context/AuthContext';

function NewModuleContent() {
  const params = useParams<{ module: string }>();
  const searchParams = useSearchParams();
  const { user, loading, can } = useAuth();
  const clientId = searchParams.get('id') || undefined;
  const productId = searchParams.get('id') || undefined;
  const isGlobalAdmin = user?.role === 'admin' && !user.organization_id;

  if (loading) return <div className="boot-screen"><span className="spinner" />Carregando…</div>;
  if (params.module === 'clientes') {
    const permission = clientId ? 'clientes.editar' : 'clientes.criar';
    if (isGlobalAdmin || !can('clientes.ver') || !can(permission)) {
      return <AppShell><section className="empty-state"><span className="empty-icon">⌁</span><h1>Acesso indisponível</h1><p>Seu perfil não possui acesso a esta área.</p></section></AppShell>;
    }
    return <AppShell><ClientEditorPage clientId={clientId} /></AppShell>;
  }
  if (params.module === 'produtos') {
    const permission = productId ? 'produtos.editar' : 'produtos.criar';
    if (isGlobalAdmin || !can('produtos.ver') || !can(permission)) {
      return <AppShell><section className="empty-state"><span className="empty-icon">⌁</span><h1>Acesso indisponível</h1><p>Seu perfil não possui acesso a esta área.</p></section></AppShell>;
    }
    return <AppShell><ProductEditorPage productId={productId} /></AppShell>;
  }
  const businessModules = ['fornecedores', 'funcionarios', 'orcamentos'];
  if (businessModules.includes(params.module)) {
    const permissions: Record<string, [string, string]> = {
      fornecedores: ['fornecedores.ver', 'fornecedores.criar'],
      funcionarios: ['users.ver', 'users.criar'],
      orcamentos: ['orcamentos.ver', 'orcamentos.criar'],
    };
    const [viewPermission, createPermission] = permissions[params.module];
    const editPermission = params.module === 'funcionarios' ? 'users.editar' : `${params.module}.editar`;
    const allowed = params.module === 'funcionarios' ? can('users.editar') : can(editPermission);
    if (isGlobalAdmin || !can(viewPermission) || (clientId ? !allowed : !can(createPermission))) {
      return <AppShell><section className="empty-state"><span className="empty-icon">⌁</span><h1>Acesso indisponível</h1><p>Seu perfil não possui acesso a esta área.</p></section></AppShell>;
    }
    return <AppShell><BusinessEditorPage module={params.module as 'fornecedores' | 'funcionarios' | 'orcamentos'} recordId={clientId} /></AppShell>;
  }
  if (params.module !== 'vendas' || !canSell(user)) {
    return <AppShell><section className="empty-state"><span className="empty-icon">⌁</span><h1>Acesso indisponível</h1><p>Seu perfil não possui acesso a esta área.</p></section></AppShell>;
  }

  return <SalesDesk />;
}

export default function NewModulePage() {
  return <Suspense fallback={<div className="boot-screen"><span className="spinner" />Carregando…</div>}><NewModuleContent /></Suspense>;
}

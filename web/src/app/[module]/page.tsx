'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { DataModule } from '@/components/DataModule';
import { ClientsPage } from '@/components/ClientsPage';
import { ProductsPage } from '@/components/ProductsPage';
import { SuppliersPage } from '@/components/SuppliersPage';
import { SalesOverview } from '@/components/SalesOverview';
import { ReportsPage } from '@/components/ReportsPage';
import { useAuth } from '@/context/AuthContext';

const moduleConfig: Record<string, { title: string; endpoint: string; permission: string }> = {
  clientes: { title: 'Clientes', endpoint: '/clientes', permission: 'clientes.ver' },
  produtos: { title: 'Produtos', endpoint: '/produtos', permission: 'produtos.ver' },
  fornecedores: { title: 'Fornecedores', endpoint: '/fornecedores', permission: 'fornecedores.ver' },
  orcamentos: { title: 'Orçamentos', endpoint: '/orcamentos', permission: 'orcamentos.ver' },
  funcionarios: { title: 'Funcionários', endpoint: '/funcionarios', permission: 'users.ver' },
  vendas: { title: 'Vendas', endpoint: '/vendas', permission: 'vendas.ver' },
  relatorios: { title: 'Relatórios', endpoint: '/relatorios', permission: 'relatorios.ver' },
};

export default function ModulePage() {
  const params = useParams<{ module: string }>();
  const module = params.module;
  const config = moduleConfig[module];
  const { can, loading, user } = useAuth();
  const isGlobalAdmin = user?.role === 'admin' && !user.organization_id;

  if (loading) return <div className="boot-screen"><span className="spinner" />Carregando…</div>;
  if (isGlobalAdmin || !config || !can(config.permission)) return <AppShell><section className="empty-state"><span className="empty-icon">⌁</span><h1>Acesso indisponível</h1><p>Seu perfil não possui acesso a esta área.</p></section></AppShell>;
  if (module === 'vendas') return <AppShell><SalesOverview /></AppShell>;
  if (module === 'clientes') return <AppShell><ClientsPage /></AppShell>;
  if (module === 'produtos') return <AppShell><ProductsPage /></AppShell>;
  if (module === 'fornecedores') return <AppShell><SuppliersPage /></AppShell>;
  return <AppShell>
    {module === 'relatorios' ? <ReportsPage /> : <DataModule title={config.title} endpoint={config.endpoint} module={module} />}
  </AppShell>;
}

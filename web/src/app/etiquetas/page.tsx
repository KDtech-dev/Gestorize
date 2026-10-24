'use client';

import { AppShell } from '@/components/AppShell';
import { LabelsCenter } from '@/components/LabelsCenter';
import { useAuth } from '@/context/AuthContext';

export default function LabelsPage() {
  const { can, loading, user } = useAuth();
  const isGlobalAdmin = user?.role === 'admin' && !user.organization_id;

  if (loading) return <div className="boot-screen"><span className="spinner" />Carregando…</div>;
  if (isGlobalAdmin || !can('produtos.ver')) return <AppShell><section className="empty-state"><span className="empty-icon">⌁</span><h1>Acesso indisponível</h1><p>Seu perfil não possui acesso a esta área.</p></section></AppShell>;
  return <AppShell><LabelsCenter /></AppShell>;
}

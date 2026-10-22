'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { Dashboard } from '@/components/Dashboard';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [loading, router, user]);
  if (loading || !user) return <div className="boot-screen"><span className="spinner" />Carregando Gestorize…</div>;
  return <AppShell><Dashboard /></AppShell>;
}

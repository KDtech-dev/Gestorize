'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { TopNavigation, type NavigationItem } from '@/components/TopNavigation';
import { UserMenu } from '@/components/UserMenu';
import { requestGuardedAction } from '@/hooks/useUnsavedChangesGuard';

const navigation: NavigationItem[] = [
  { href: '/', title: 'Visão geral', icon: 'mdi:view-dashboard-outline' },
  { href: '/clientes', title: 'Clientes', icon: 'mdi:account-multiple-outline', permission: 'clientes.ver' },
  { href: '/produtos', title: 'Produtos', icon: 'mdi:package-variant-closed', permission: 'produtos.ver' },
  { href: '/fornecedores', title: 'Fornecedores', icon: 'mdi:truck-outline', permission: 'fornecedores.ver' },
  { href: '/orcamentos', title: 'Orçamentos', icon: 'mdi:file-document-outline', permission: 'orcamentos.ver' },
  { href: '/vendas', title: 'Vendas', icon: 'mdi:cash-register', permission: 'vendas.ver' },
  { href: '/funcionarios', title: 'Funcionários', icon: 'mdi:account-cog-outline', permission: 'users.ver' },
  { href: '/relatorios', title: 'Relatórios', icon: 'mdi:chart-box-outline', permission: 'relatorios.ver' },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut, can } = useAuth();
  const { mode, toggle } = useTheme();
  const isGlobalAdmin = user?.role === 'admin' && !user.organization_id;
  const isEditorPage = pathname.endsWith('/nova');
  const guardedSignOut = () => requestGuardedAction(() => { void signOut(); });
  const visibleNavigation = navigation.filter((item) => {
    if (isGlobalAdmin) return item.href === '/';
    return !item.permission || can(item.permission);
  });
  const isNavigationActive = (href: string) => pathname === href || (['/clientes', '/produtos'].includes(href) && pathname.startsWith(`${href}/`));

  return <div className="app-frame">
    <aside className="sidebar">
      <nav className="side-nav" aria-label="Navegação principal">
        {visibleNavigation.map((item) => <Link key={item.href} href={item.href} className={`nav-link ${isNavigationActive(item.href) ? 'active' : ''}`} aria-label={item.title}>
          <span className="nav-icon" data-tooltip={item.title}><Icon icon={item.icon} width={19} height={19} /></span><span>{item.title}</span>{isNavigationActive(item.href) && <span className="nav-current" />}
        </Link>)}
      </nav>
      <div className="sidebar-bottom">
        <button className="logout-button" onClick={guardedSignOut}><span>↪</span>Sair da conta</button>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <Link href="/" className="brand topbar-brand"> <Image src={mode === 'light' ? '/images/LogoLight.png' : '/images/Logo.png'} alt="Gestorize" width={58} height={50} priority /></Link>
        <TopNavigation items={visibleNavigation} name={user?.name ?? 'Usuário'} email={user?.email ?? ''} imageUrl={user?.avatar_url ?? user?.avatar} darkMode={mode === 'dark'} onToggleTheme={toggle} onSignOut={guardedSignOut} />
        <div className="topbar-right"><button className="theme-toggle" onClick={toggle} aria-label={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} data-tooltip={mode === 'dark' ? 'Tema claro' : 'Tema escuro'}>{mode === 'dark' ? '☀' : '☾'}</button><UserMenu name={user?.name ?? 'Usuário'} email={user?.email ?? ''} role={user?.role ?? 'Usuário'} imageUrl={user?.avatar_url ?? user?.avatar} signOut={async () => { guardedSignOut(); }} /></div>
      </header>
      <div className={`page-content ${pathname === '/' ? 'dashboard-content' : ''} ${isEditorPage ? 'editor-content' : ''} ${['/clientes', '/clientes/nova', '/produtos', '/produtos/nova', '/fornecedores', '/orcamentos', '/funcionarios', '/vendas', '/relatorios'].includes(pathname) ? 'clients-content' : ''}`}>{children}</div>
    </main>
  </div>;
}

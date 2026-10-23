'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const navigation = [
  { href: '/', title: 'Visão geral', icon: '▦' },
  { href: '/clientes', title: 'Clientes', icon: '◉', permission: 'clientes.ver' },
  { href: '/produtos', title: 'Produtos', icon: '▣', permission: 'produtos.ver' },
  { href: '/fornecedores', title: 'Fornecedores', icon: '⇄', permission: 'fornecedores.ver' },
  { href: '/orcamentos', title: 'Orçamentos', icon: '▤', permission: 'orcamentos.ver' },
  { href: '/vendas', title: 'Vendas', icon: '▥', permission: 'vendas.ver' },
  { href: '/funcionarios', title: 'Funcionários', icon: '♙', permission: 'users.ver' },
  { href: '/relatorios', title: 'Relatórios', icon: '⌁', permission: 'relatorios.ver' },
];
const utilityPages: Record<string, string> = { '/ajuda': 'Ajuda', '/configuracoes': 'Configurações', '/perfil': 'Meu perfil' };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut, can } = useAuth();
  const { mode, toggle } = useTheme();
  const visibleNavigation = navigation.filter((item) => !item.permission || can(item.permission));
  const currentPage = visibleNavigation.find((item) => item.href === pathname)?.title ?? utilityPages[pathname] ?? 'Gestão';

  return <div className="app-frame">
    <aside className="sidebar">
      <Link href="/" className="brand"><Image src={mode === 'dark' ? '/images/LogoLight.png' : '/images/Logo.png'} alt="Gestorize" width={58} height={50} priority /><span>Gestorize</span></Link>
      <div className="workspace-label">ESPAÇO DE TRABALHO</div>
      <nav className="side-nav" aria-label="Navegação principal">
        {visibleNavigation.map((item) => <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href ? 'active' : ''}`} aria-label={item.title}>
          <span className="nav-icon" data-tooltip={item.title}>{item.icon}</span><span>{item.title}</span>{pathname === item.href && <span className="nav-current" />}
        </Link>)}
      </nav>
      <div className="sidebar-bottom">
        <button className="logout-button" onClick={() => void signOut()}><span>↪</span>Sair da conta</button>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><span className="topbar-kicker">GESTORIZE <span>/</span> PAINEL</span><p>{currentPage}</p></div><div className="topbar-right"><Link className="header-utility" href="/ajuda" aria-label="Central de ajuda" data-tooltip="Central de ajuda">?</Link><Link className="header-utility" href="/configuracoes" aria-label="Configurações" data-tooltip="Configurações">⚙</Link><button className="theme-toggle" onClick={toggle} aria-label={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} data-tooltip={mode === 'dark' ? 'Tema claro' : 'Tema escuro'}>{mode === 'dark' ? '☀' : '☾'}</button><Link href="/perfil" className="top-account" aria-label="Abrir perfil"><span className="avatar top-avatar">{(user?.name ?? 'U').slice(0, 1).toUpperCase()}</span><strong>{user?.name ?? 'Usuário'}</strong></Link></div></header>
      <div className="page-content">{children}</div>
    </main>
  </div>;
}

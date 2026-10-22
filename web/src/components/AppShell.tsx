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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut, can } = useAuth();
  const { mode, toggle } = useTheme();
  const visibleNavigation = navigation.filter((item) => !item.permission || can(item.permission));

  return <div className="app-frame">
    <aside className="sidebar">
      <Link href="/" className="brand"><Image src={mode === 'dark' ? '/images/LogoLight.png' : '/images/Logo.png'} alt="Gestorize" width={58} height={50} priority /><span>Gestorize</span></Link>
      <div className="workspace-label">ESPAÇO DE TRABALHO</div>
      <nav className="side-nav" aria-label="Navegação principal">
        {visibleNavigation.map((item) => <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
          <span className="nav-icon">{item.icon}</span><span>{item.title}</span>{pathname === item.href && <span className="nav-current" />}
        </Link>)}
      </nav>
      <div className="sidebar-bottom">
        <Link href="/perfil" className="user-mini"><div className="avatar">{(user?.name ?? 'U').slice(0, 1).toUpperCase()}</div><div className="user-meta"><strong>{user?.name}</strong><span>{user?.role ?? 'Usuário'}</span></div></Link>
        <div className="sidebar-utilities"><Link href="/configuracoes">⚙ Configurações</Link><Link href="/ajuda">? Central de ajuda</Link></div>
        <button className="logout-button" onClick={() => void signOut()}><span>↪</span>Sair da conta</button>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><span className="topbar-kicker">GESTORIZE <span>/</span> PAINEL</span><p>Olá, {(user?.name ?? '').split(' ')[0]}</p></div><div className="topbar-right"><span className="connection"><i />API conectada</span><Link className="header-utility" href="/ajuda" aria-label="Central de ajuda" title="Central de ajuda">?</Link><Link className="header-utility" href="/configuracoes" aria-label="Configurações" title="Configurações">⚙</Link><button className="theme-toggle" onClick={toggle} aria-label={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} title={mode === 'dark' ? 'Tema claro' : 'Tema escuro'}>{mode === 'dark' ? '☀' : '☾'}</button><Link href="/perfil" className="avatar top-avatar" aria-label="Meu perfil">{(user?.name ?? 'U').slice(0, 1).toUpperCase()}</Link></div></header>
      <div className="page-content">{children}</div>
    </main>
  </div>;
}

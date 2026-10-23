'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, unwrap } from '@/lib/api';

type Summary = { clientes: number | null; orcamentos_aprovados: number | null; orcamentos_pendentes: number | null; produtos_em_estoque: number | null };
type Report = { totais: Record<string, number>; serie: { rotulos: string[]; valores: number[] } };
const cards = [
  { key: 'clientes', label: 'Clientes cadastrados', icon: '◉', color: 'violet', permission: 'clientes.ver', href: '/clientes' },
  { key: 'orcamentos_aprovados', label: 'Orçamentos aprovados', icon: '✓', color: 'green', permission: 'orcamentos.ver', href: '/orcamentos' },
  { key: 'orcamentos_pendentes', label: 'Orçamentos pendentes', icon: '◷', color: 'orange', permission: 'orcamentos.ver', href: '/orcamentos' },
  { key: 'produtos_em_estoque', label: 'Produtos em estoque', icon: '▣', color: 'blue', permission: 'produtos.ver', href: '/produtos' },
] as const;

export function Dashboard() {
  const { can } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(true);

  useEffect(() => {
    apiFetch<unknown>('/dashboard/resumo')
      .then((response) => setSummary(unwrap<Summary>(response as never)))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o resumo.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!can('relatorios.ver')) { setReportLoading(false); return; }
    apiFetch<unknown>('/relatorios?periodo=semana&tipo=orcamentos')
      .then((response) => setReport(unwrap<Report>(response as never)))
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  }, [can]);

  const visibleCards = cards.filter((card) => can(card.permission));
  return <>
    <section className="welcome-banner"><div><span className="eyebrow">SEU NEGÓCIO EM FOCO</span><h1>Gestão simples, decisões melhores.</h1><p>Acompanhe os principais indicadores e acesse seus módulos.</p></div><div className="banner-mark">G</div></section>
    <div className="section-heading"><div><span className="eyebrow">ACOMPANHAMENTO</span><h2>Resumo do sistema</h2></div><span className="live-label"><i />Dados da API</span></div>
    {error && <div className="inline-error">{error}</div>}
    <section className="metric-grid">
      {visibleCards.map((card) => <article className={`metric-card ${card.color}`} key={card.key}>
        <div className="metric-card-head"><span>{card.label}</span><span className="metric-icon">{card.icon}</span></div>
        <strong>{loading ? '—' : (summary?.[card.key] ?? 0).toLocaleString('pt-BR')}</strong>
        <Link href={card.href}>Abrir {card.href === '/orcamentos' ? 'orçamentos' : card.href.slice(1)} <span>↗</span></Link>
      </article>)}
    </section>
    {can('relatorios.ver') && <section className="overview-grid">
      <article className="data-panel overview-chart-panel">
        <div className="panel-heading"><div><span className="eyebrow">ÚLTIMOS 7 DIAS</span><h2>Orçamentos criados</h2><p>Quantidade registrada em cada dia.</p></div><Link href="/relatorios" className="overview-link">Ver relatórios ↗</Link></div>
        {reportLoading ? <div className="table-loading"><span className="spinner" />Carregando atividade…</div> : report?.serie.rotulos.length ? <div className="overview-bars">{report.serie.rotulos.map((label, index) => {
          const value = Number(report.serie.valores[index] ?? 0);
          const max = Math.max(...report.serie.valores, 1);
          return <div className="overview-bar-column" key={`${label}-${index}`}><strong>{value}</strong><div className="overview-bar-track"><span style={{ height: `${Math.max(value ? 8 : 3, value / max * 100)}%` }} /></div><small>{label}</small></div>;
        })}</div> : <div className="overview-empty">Ainda não há orçamentos neste período.</div>}
      </article>
      <article className="data-panel overview-status-panel">
        <div className="panel-heading"><div><span className="eyebrow">MOVIMENTAÇÃO RECENTE</span><h2>Atividade de orçamentos</h2><p>Eventos registrados durante esta semana.</p></div></div>
        {reportLoading ? <div className="overview-empty">Atualizando…</div> : <>
          <div className="overview-status-total"><strong>{Number(report?.totais.orcamentos ?? 0).toLocaleString('pt-BR')}</strong><span>criados na semana</span></div>
          <div className="overview-status-row"><span><i className="status-dot approved-dot" />Aprovações registradas</span><strong>{Number(report?.totais.aprovacoes ?? 0).toLocaleString('pt-BR')}</strong></div>
          <div className="overview-status-row"><span><i className="status-dot pending-dot" />Pendentes criados</span><strong>{Number(report?.totais.pendentes ?? 0).toLocaleString('pt-BR')}</strong></div>
        </>}
      </article>
    </section>}
    <section className="section-heading quick-heading"><div><span className="eyebrow">NAVEGAÇÃO</span><h2>Acesso rápido</h2></div></section>
    <section className="quick-grid">
      {[
        { href: '/clientes', title: 'Clientes', description: 'Cadastros e histórico', icon: '◉', permission: 'clientes.ver' },
        { href: '/produtos', title: 'Produtos', description: 'Catálogo e estoque', icon: '▣', permission: 'produtos.ver' },
        { href: '/orcamentos', title: 'Orçamentos', description: 'Propostas e aprovações', icon: '▤', permission: 'orcamentos.ver' },
        { href: '/vendas', title: 'Vendas', description: 'Registrar e consultar vendas', icon: '▥', permission: 'vendas.ver' },
        { href: '/fornecedores', title: 'Fornecedores', description: 'Parceiros cadastrados', icon: '⇄', permission: 'fornecedores.ver' },
        { href: '/funcionarios', title: 'Funcionários', description: 'Equipe e acessos', icon: '♙', permission: 'users.ver' },
        { href: '/relatorios', title: 'Relatórios', description: 'Indicadores e movimentações', icon: '⌁', permission: 'relatorios.ver' },
      ].filter((item) => can(item.permission)).map((item) => <Link href={item.href} className="quick-card" key={item.href}><span className="quick-icon">{item.icon}</span><span className="quick-copy"><strong>{item.title}</strong><small>{item.description}</small></span><span className="quick-arrow">↗</span></Link>)}
    </section>
  </>;
}

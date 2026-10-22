'use client';

import { useEffect, useState } from 'react';
import { apiFetch, unwrap } from '@/lib/api';

type Report = { nota?: string; totais: Record<string, number>; serie: { rotulos: string[]; valores: number[]; categorias: Array<{ nome: string; quantidade: number }> } };
const labels: Record<string, string> = { valor_orcado: 'Valor orçado', orcamentos: 'Orçamentos', aprovacoes: 'Aprovações', pendentes: 'Pendentes', clientes: 'Clientes', produtos: 'Produtos' };
const money = (number: number) => Number(number ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ReportsPage() {
  const [period, setPeriod] = useState('mes');
  const [kind, setKind] = useState('movimentacao');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true); setError('');
    apiFetch<unknown>(`/relatorios?periodo=${period}&tipo=${kind}`).then((response) => setReport(unwrap<Report>(response as never))).catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o relatório.')).finally(() => setLoading(false));
  }, [period, kind]);
  const values = report?.serie?.valores ?? [];
  const max = Math.max(...values, 1);
  return <>
    <div className="page-heading"><div><span className="eyebrow">DESEMPENHO</span><h1>Relatórios</h1><p>Indicadores reais das movimentações cadastradas no Gestorize.</p></div><div className="report-filters"><select value={kind} onChange={(event) => setKind(event.target.value)}><option value="movimentacao">Movimentações</option><option value="orcamentos">Orçamentos</option><option value="clientes">Clientes</option><option value="produtos">Produtos</option></select><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="hoje">Hoje</option><option value="semana">Esta semana</option><option value="mes">Este mês</option><option value="ano">Este ano</option></select></div></div>
    {error && <div className="inline-error">{error}</div>}
    <section className="report-summary">{Object.entries(report?.totais ?? {}).map(([key, value]) => <article className="report-total-card" key={key}><span>{labels[key] ?? key.replaceAll('_', ' ')}</span><strong>{key === 'valor_orcado' ? money(value) : Number(value).toLocaleString('pt-BR')}</strong></article>)}</section>
    <section className="data-panel chart-panel"><div className="panel-heading"><div><h2>Movimentação no período</h2><p>{report?.nota ?? 'Valores agrupados conforme o período selecionado.'}</p></div><span className="panel-tag">{loading ? 'ATUALIZANDO' : period.toUpperCase()}</span></div>
      {loading ? <div className="table-loading"><span className="spinner" />Atualizando relatório…</div> : <div className="bar-chart">{report?.serie?.rotulos?.map((label, index) => <div className="bar-column" key={`${label}-${index}`}><span className="bar-value">{Number(values[index] ?? 0).toLocaleString('pt-BR')}</span><div className="bar-track"><div className="bar-fill" style={{ height: `${Math.max(6, Number(values[index] ?? 0) / max * 100)}%` }} /></div><span className="bar-label">{label}</span></div>)}</div>}
    </section>
    {!!report?.serie?.categorias?.length && <section className="data-panel category-report"><h2>Produtos por categoria</h2>{report.serie.categorias.map((item) => <div className="category-row" key={item.nome}><span>{item.nome}</span><strong>{item.quantidade}</strong></div>)}</section>}
  </>;
}

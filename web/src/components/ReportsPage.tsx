'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { FormControl, InputLabel, MenuItem, Select, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { apiFetch, unwrap } from '@/lib/api';

type Report = { nota?: string; totais: Record<string, unknown>; serie: { rotulos: string[]; valores: number[]; categorias: Array<{ nome: string; quantidade: number }> } };
type ChartType = 'colunas' | 'linha' | 'area' | 'rosca';
const labels: Record<string, string> = { valor_orcado: 'Valor orçado', orcamentos: 'Orçamentos', aprovacoes: 'Aprovações', pendentes: 'Pendentes', clientes: 'Clientes', produtos: 'Produtos', vendas: 'Vendas', faturamento_vendas: 'Faturamento em vendas', descontos_vendas: 'Descontos concedidos' };
const colors = ['#0875e1', '#09a878', '#f08a24', '#8b5cf6', '#e34d79', '#08a7b5', '#d4a20c', '#4d67e8'];
const summaryIcons: Record<string, string> = { valor_orcado: 'mdi:cash-multiple', orcamentos: 'mdi:file-document-multiple-outline', aprovacoes: 'mdi:check-circle-outline', pendentes: 'mdi:clock-outline', clientes: 'mdi:account-group-outline', produtos: 'mdi:package-variant-closed' };
const reportKinds = [{ value: 'movimentacao', label: 'Movimentações' }, { value: 'vendas', label: 'Vendas' }, { value: 'orcamentos', label: 'Orçamentos' }, { value: 'clientes', label: 'Clientes' }, { value: 'produtos', label: 'Produtos' }];
const periods = [{ value: 'hoje', label: 'Hoje' }, { value: 'semana', label: 'Esta semana' }, { value: 'mes', label: 'Este mês' }, { value: 'ano', label: 'Este ano' }];
const chartTypes: Array<{ value: ChartType; label: string; icon: string }> = [{ value: 'colunas', label: 'Colunas', icon: 'mdi:chart-bar' }, { value: 'linha', label: 'Linha', icon: 'mdi:chart-line' }, { value: 'area', label: 'Área', icon: 'mdi:chart-areaspline' }, { value: 'rosca', label: 'Rosca', icon: 'mdi:chart-donut' }];
const money = (number: number) => Number(number ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const numericTotals = (totals: Record<string, unknown>) => Object.entries(totals).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]));

function ReportFilters({ kind, period, onKind, onPeriod }: { kind: string; period: string; onKind: (value: string) => void; onPeriod: (value: string) => void }) {
  return <div className="report-filters">
    <FormControl className="client-type-select-field report-select-field">
      <InputLabel id="report-kind-label">Tipo de relatório</InputLabel>
      <Select labelId="report-kind-label" value={kind} label="Tipo de relatório" onChange={(event) => onKind(String(event.target.value))} MenuProps={{ disablePortal: true, slotProps: { paper: { sx: { backgroundColor: 'var(--card)', color: 'var(--ink)' } } } }}>
        {reportKinds.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
      </Select>
    </FormControl>
    <FormControl className="client-type-select-field report-select-field">
      <InputLabel id="report-period-label">Período</InputLabel>
      <Select labelId="report-period-label" value={period} label="Período" onChange={(event) => onPeriod(String(event.target.value))} MenuProps={{ disablePortal: true, slotProps: { paper: { sx: { backgroundColor: 'var(--card)', color: 'var(--ink)' } } } }}>
        {periods.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
      </Select>
    </FormControl>
  </div>;
}

function ReportHeading({ kind, period, onKind, onPeriod }: { kind: string; period: string; onKind: (value: string) => void; onPeriod: (value: string) => void }) {
  return <header className="clients-page-heading report-page-heading">
    <div className="clients-heading-content"><span className="eyebrow"><Icon icon="mdi:chart-box-outline" width={19} height={19} /><span>ANÁLISES E INDICADORES</span></span><h1>Relatórios</h1><p>Acompanhe os resultados e as movimentações da sua organização.</p></div>
    <ReportFilters kind={kind} period={period} onKind={onKind} onPeriod={onPeriod} />
  </header>;
}

function ReportSummary({ totals, loading }: { totals: Record<string, unknown>; loading: boolean }) {
  const entries = numericTotals(totals);
  if (!entries.length && loading) return <section className="report-summary" aria-label="Indicadores do relatório">{Array.from({ length: 3 }, (_, index) => <article className="report-total-card report-total-skeleton" key={index}><span>Carregando indicador</span><strong>—</strong></article>)}</section>;
  return <section className="report-summary" aria-label="Indicadores do relatório">{entries.map(([key, value], index) => <article className="report-total-card" key={key} style={{ '--report-color': colors[index % colors.length] } as CSSProperties}>
    <span className="report-total-icon"><Icon icon={summaryIcons[key] ?? 'mdi:chart-box-outline'} width={22} height={22} /></span>
    <span className="report-total-label">{labels[key] ?? key.replaceAll('_', ' ')}</span>
    <strong>{key.includes('valor') || key.includes('faturamento') || key.includes('descontos') ? money(value) : Number(value).toLocaleString('pt-BR')}</strong>
  </article>)}</section>;
}

function ReportChart({ report, loading, period, kind, chartType, onChartType }: { report: Report | null; loading: boolean; period: string; kind: string; chartType: ChartType; onChartType: (value: ChartType) => void }) {
  const categorySeries = kind === 'produtos' ? report?.serie?.categorias ?? [] : [];
  const labels = categorySeries.length ? categorySeries.map((item) => item.nome) : report?.serie?.rotulos ?? [];
  const values = categorySeries.length ? categorySeries.map((item) => item.quantidade) : report?.serie?.valores ?? [];
  const max = Math.max(...values, 1);
  const total = values.reduce((sum, value) => sum + Number(value || 0), 0);
  const periodName = periods.find((option) => option.value === period)?.label ?? period;
  const linePoints = values.map((value, index) => {
    const x = values.length <= 1 ? 500 : 32 + (index / (values.length - 1)) * 936;
    const y = 266 - (Number(value || 0) / max) * 225;
    return `${x},${y}`;
  }).join(' ');
  const areaPath = values.length ? `M ${linePoints.split(' ').join(' L ')} L 968,276 L 32,276 Z` : '';
  let angle = 0;
  const donutStops = values.map((value, index) => {
    const next = angle + (total ? Number(value || 0) / total * 360 : 0);
    const stop = `${colors[index % colors.length]} ${angle}deg ${next}deg`;
    angle = next;
    return stop;
  }).join(', ');
  const title = kind === 'vendas' ? 'Vendas no período' : kind === 'produtos' ? 'Produtos por categoria' : kind === 'clientes' ? 'Novos clientes no período' : kind === 'orcamentos' ? 'Orçamentos no período' : 'Movimentação no período';
  return <section className="data-panel chart-panel report-chart-panel">
    <div className="panel-heading"><div><span className="eyebrow">SÉRIE HISTÓRICA</span><h2>{title}</h2><p>{report?.nota ?? 'Valores agrupados conforme o período selecionado.'}</p></div><div className="report-chart-tools"><span className="panel-tag">{periodName.toUpperCase()}</span><ToggleButtonGroup exclusive value={chartType} onChange={(_, value: ChartType | null) => { if (value) onChartType(value); }} aria-label="Modelo do gráfico" className="report-chart-switcher">
      {chartTypes.map((option) => <ToggleButton key={option.value} value={option.value} aria-label={option.label} title={option.label}><Icon icon={option.icon} width={18} height={18} /><span>{option.label}</span></ToggleButton>)}
      </ToggleButtonGroup></div></div>
    {loading ? <div className="table-loading"><span className="spinner" />Atualizando relatório…</div> : values.length ? chartType === 'rosca' ? <div className="report-donut-layout">
      <div className="report-donut" role="img" aria-label={`Gráfico de rosca: ${labels.map((label, index) => `${label}: ${Number(values[index] ?? 0).toLocaleString('pt-BR')}`).join('; ')}`} style={{ background: `conic-gradient(${donutStops})` }}><div><strong>{total.toLocaleString('pt-BR')}</strong><span>{kind === 'produtos' ? 'produtos' : 'registros'}</span></div></div>
      <div className="report-chart-legend">{labels.map((label, index) => <div key={`${label}-${index}`}><i style={{ background: colors[index % colors.length] }} /><span>{label}</span><strong>{Number(values[index] ?? 0).toLocaleString('pt-BR')}</strong></div>)}</div>
    </div> : chartType === 'linha' || chartType === 'area' ? <div className={`report-line-chart ${chartType}`} role="img" aria-label={`Gráfico ${chartType}: ${labels.map((label, index) => `${label}: ${Number(values[index] ?? 0).toLocaleString('pt-BR')}`).join('; ')}`}>
      <svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="report-line-gradient" x1="0" x2="1"><stop offset="0%" stopColor="#0875e1" /><stop offset="50%" stopColor="#09a878" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient><linearGradient id="report-area-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0875e1" stopOpacity=".35" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity=".03" /></linearGradient></defs>
        {[50, 105, 160, 215, 270].map((y) => <line key={y} x1="30" x2="970" y1={y} y2={y} className="report-grid-line" />)}
        {chartType === 'area' && <path d={areaPath} fill="url(#report-area-gradient)" />}
        <polyline points={linePoints} fill="none" stroke="url(#report-line-gradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {values.map((_, index) => { const point = linePoints.split(' ')[index]?.split(',').map(Number) ?? [0, 0]; return <circle key={`${labels[index]}-${index}`} cx={point[0]} cy={point[1]} r="6" fill={colors[index % colors.length]} stroke="var(--card)" strokeWidth="3" />; })}
      </svg><div className="report-line-labels">{labels.map((label, index) => <span key={`${label}-${index}`} title={label}>{index % Math.max(1, Math.ceil(labels.length / 12)) === 0 || index === labels.length - 1 ? label : ''}</span>)}</div>
    </div> : <div className="bar-chart" role="img" aria-label={`Gráfico de colunas: ${labels.map((label, index) => `${label}: ${Number(values[index] ?? 0).toLocaleString('pt-BR')}`).join('; ')}`}>
      {labels.map((label, index) => {
        const color = colors[index % colors.length];
        const value = Number(values[index] ?? 0);
        return <div className="bar-column" key={`${label}-${index}`} title={`${label}: ${value.toLocaleString('pt-BR')}`} style={{ '--bar-color': color } as CSSProperties}>
          <span className="bar-value">{value.toLocaleString('pt-BR')}</span>
          <div className="bar-track"><div className="bar-fill" style={{ height: `${Math.max(6, value / max * 100)}%` }} /></div>
          <span className="bar-label" style={{ '--bar-color': color } as CSSProperties}>{label}</span>
        </div>;
      })}
    </div> : <div className="report-empty"><Icon icon="mdi:chart-box-outline" width={30} height={30} /><strong>Sem dados para este período</strong><span>Escolha outro período ou tipo de relatório para consultar resultados.</span></div>}
  </section>;
}

export function ReportsPage() {
  const [period, setPeriod] = useState('mes');
  const [kind, setKind] = useState('movimentacao');
  const [chartType, setChartType] = useState<ChartType>('colunas');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true); setError('');
    apiFetch<unknown>(`/relatorios?periodo=${period}&tipo=${kind}`).then((response) => setReport(unwrap<Report>(response as never))).catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o relatório.')).finally(() => setLoading(false));
  }, [period, kind]);

  return <div className="clients-page reports-page">
    <ReportHeading kind={kind} period={period} onKind={setKind} onPeriod={setPeriod} />
    {error && <div className="inline-error reports-inline-error">{error}</div>}
    <ReportSummary totals={report?.totais ?? {}} loading={loading} />
    <ReportChart report={report} loading={loading} period={period} kind={kind} chartType={chartType} onChartType={setChartType} />
  </div>;
}

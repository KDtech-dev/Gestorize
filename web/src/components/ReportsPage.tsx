'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { Button, FormControl, InputLabel, MenuItem, Paper, Select, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { apiFetch, unwrap } from '@/lib/api';
import reportStyles from './ReportsPage.module.css';

type Report = { nota?: string; intervalo?: { inicio: string; fim: string }; totais: Record<string, unknown>; serie: { rotulos: string[]; valores: number[]; categorias: Array<{ nome: string; quantidade: number }> } };
type ChartType = 'colunas' | 'area' | 'rosca';
const labels: Record<string, string> = { valor_orcado: 'Valor orçado', orcamentos: 'Orçamentos', aprovacoes: 'Aprovações', pendentes: 'Pendentes', clientes: 'Clientes', produtos: 'Produtos', vendas: 'Vendas', faturamento_vendas: 'Faturamento em vendas', descontos_vendas: 'Descontos concedidos' };
const colors = ['#0875e1', '#09a878', '#f08a24', '#8b5cf6', '#e34d79', '#08a7b5', '#d4a20c', '#4d67e8'];
const summaryIcons: Record<string, string> = { valor_orcado: 'mdi:cash-multiple', orcamentos: 'mdi:file-document-multiple-outline', aprovacoes: 'mdi:check-circle-outline', pendentes: 'mdi:clock-outline', clientes: 'mdi:account-group-outline', produtos: 'mdi:package-variant-closed' };
const reportKinds = [{ value: 'movimentacao', label: 'Movimentações' }, { value: 'vendas', label: 'Vendas' }, { value: 'orcamentos', label: 'Orçamentos' }, { value: 'clientes', label: 'Clientes' }, { value: 'produtos', label: 'Produtos' }];
const periods = [{ value: 'hoje', label: 'Hoje' }, { value: 'semana', label: 'Esta semana' }, { value: 'mes', label: 'Este mês' }, { value: 'ano', label: 'Este ano' }];
const chartTypes: Array<{ value: ChartType; label: string; icon: string }> = [{ value: 'colunas', label: 'Colunas', icon: 'mdi:chart-bar' }, { value: 'area', label: 'Área', icon: 'mdi:chart-areaspline' }, { value: 'rosca', label: 'Rosca', icon: 'mdi:chart-donut' }];
const money = (number: number) => Number(number ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const numericTotals = (totals: Record<string, unknown>) => Object.entries(totals).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]));

function groupAdjacentEqualValues(labels: string[], values: number[], sumGroupedValues = false) {
  const grouped: Array<{ start: string; end: string; matchValue: number; value: number }> = [];
  labels.forEach((label, index) => {
    const value = Number(values[index] ?? 0);
    const previous = grouped[grouped.length - 1];
    if (previous && previous.matchValue === value) {
      previous.end = label;
      if (sumGroupedValues) previous.value += value;
      return;
    }
    grouped.push({ start: label, end: label, matchValue: value, value });
  });
  return grouped.map(({ start, end, value }) => ({ label: start === end ? start : `${start} – ${end}`, value }));
}

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

function buildReportPreview(report: Report, kind: string, period: string, chartType: ChartType) {
  const categorySeries = kind === 'produtos' ? report.serie.categorias ?? [] : [];
  const rawLabels = categorySeries.length ? categorySeries.map((item) => item.nome) : report.serie.rotulos ?? [];
  const rawValues = categorySeries.length ? categorySeries.map((item) => item.quantidade) : report.serie.valores ?? [];
  const series = categorySeries.length
    ? rawLabels.map((label, index) => ({ label, value: Number(rawValues[index] ?? 0) }))
    : groupAdjacentEqualValues(rawLabels, rawValues, chartType === 'rosca');
  const totals = numericTotals(report.totais);
  const maxValue = Math.max(...series.map((item) => item.value), 1);
  const periodLabel = periods.find((item) => item.value === period)?.label ?? period;
  const dateLabel = report.intervalo
    ? `${new Date(`${report.intervalo.inicio}T00:00:00`).toLocaleDateString('pt-BR')} a ${new Date(`${report.intervalo.fim}T00:00:00`).toLocaleDateString('pt-BR')}`
    : periodLabel;
  const reportTitle = reportKinds.find((item) => item.value === kind)?.label ?? 'Relatório';
  const formatTotal = (key: string, value: number) => key.includes('valor') || key.includes('faturamento') || key.includes('descontos') ? money(value) : value.toLocaleString('pt-BR');
  const formatSeriesValue = (value: number) => kind === 'movimentacao' ? money(value) : value.toLocaleString('pt-BR');
  const metricsHtml = totals.map(([key, value], index) => `<article class="metric" style="--metric-color:${colors[index % colors.length]}"><span>${escapeHtml(labels[key] ?? key.replaceAll('_', ' '))}</span><strong>${escapeHtml(formatTotal(key, value))}</strong></article>`).join('');
  const seriesHtml = series.map((item, index) => {
    const width = Math.max(item.value > 0 ? 2 : 0, item.value / maxValue * 100);
    return `<div class="series-row"><span class="series-label">${escapeHtml(item.label)}</span><span class="track"><i style="width:${width}%;background:${colors[index % colors.length]}"></i></span><strong>${escapeHtml(formatSeriesValue(item.value))}</strong></div>`;
  }).join('') || '<p class="empty">Nenhum dado para este período.</p>';

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Relatório Gestorize · ${escapeHtml(reportTitle)}</title><style>
    *{box-sizing:border-box}html,body{margin:0;background:#e8edf3;color:#172033;font-family:Arial,sans-serif}body{padding:24px}.paper{width:min(100%,210mm);min-height:270mm;margin:0 auto;padding:18mm;background:#fff;box-shadow:0 8px 32px #102a4326}.brand{font-size:10px;font-weight:800;letter-spacing:1.7px;color:#005ce4;text-transform:uppercase}.topline{height:4px;margin:12px 0 22px;background:linear-gradient(90deg,#005ce4,#09a878,#8b5cf6)}h1{margin:0;color:#102a43;font-size:26px}.subtitle{margin:7px 0 0;color:#64748b;font-size:13px}.meta{display:flex;justify-content:space-between;gap:16px;margin:22px 0;padding:12px 0;border-top:1px solid #dbe2ea;border-bottom:1px solid #dbe2ea;color:#475569;font-size:11px}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.metric{min-height:74px;padding:12px;border:1px solid color-mix(in srgb,var(--metric-color) 30%,#dbe2ea);border-radius:9px;background:color-mix(in srgb,var(--metric-color) 7%,white)}.metric span{display:block;margin-bottom:9px;color:#64748b;font-size:10px}.metric strong{color:#102a43;font-size:17px}.section{margin-top:24px}.section h2{margin:0 0 12px;color:#102a43;font-size:16px}.section-note{margin:-5px 0 12px;color:#64748b;font-size:10px}.series-row{display:grid;grid-template-columns:minmax(95px,1fr) minmax(100px,2fr) minmax(85px,.8fr);align-items:center;gap:12px;min-height:35px;border-bottom:1px solid #edf0f4;font-size:10px}.series-label{overflow:hidden;color:#475569;text-overflow:ellipsis;white-space:nowrap}.track{height:9px;overflow:hidden;border-radius:99px;background:#edf2f7}.track i{display:block;height:100%;border-radius:inherit}.series-row strong{text-align:right;color:#172033;font-size:10px}.empty{padding:25px;text-align:center;color:#64748b}.note{margin-top:23px;padding:12px;border-left:3px solid #d4a20c;background:#f8fafc;color:#475569;font-size:10px;line-height:1.5}.footer{margin-top:26px;padding-top:10px;border-top:1px solid #dbe2ea;color:#94a3b8;font-size:9px}
    @page{size:A4;margin:0}@media print{html,body{background:#fff}body{padding:0}.paper{width:210mm;min-height:297mm;margin:0;padding:16mm;box-shadow:none}.metric,.track,.topline,.note{-webkit-print-color-adjust:exact;print-color-adjust:exact}.section,.metric{break-inside:avoid}}
    @media(max-width:650px){body{padding:0}.paper{min-height:100vh;padding:24px 18px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.meta{flex-direction:column}}
  </style></head><body><main class="paper">
    <div class="brand">Gestorize · Relatórios</div><div class="topline"></div>
    <h1>${escapeHtml(reportTitle)}</h1><p class="subtitle">Resumo de indicadores e série histórica da organização.</p>
    <div class="meta"><span>Período: <strong>${escapeHtml(periodLabel)} · ${escapeHtml(dateLabel)}</strong></span><span>Gerado em: ${escapeHtml(new Date().toLocaleString('pt-BR'))}</span></div>
    <section class="metrics">${metricsHtml}</section>
    <section class="section"><h2>${escapeHtml(kind === 'produtos' ? 'Produtos por categoria' : 'Série do período')}</h2><p class="section-note">Faixas consecutivas com valores iguais foram agrupadas.</p>${seriesHtml}</section>
    ${report.nota ? `<p class="note">${escapeHtml(report.nota)}</p>` : ''}
    <footer class="footer">Documento gerado pelo Gestorize com base nos dados registrados até o momento da emissão.</footer>
  </main></body></html>`;
}

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

function ReportHeading({ kind, period, onKind, onPeriod, onPreview, previewDisabled }: { kind: string; period: string; onKind: (value: string) => void; onPeriod: (value: string) => void; onPreview: () => void; previewDisabled: boolean }) {
  return <header className="clients-page-heading report-page-heading">
    <div className="clients-heading-content"><span className="eyebrow"><Icon icon="mdi:chart-box-outline" width={19} height={19} /><span>ANÁLISES E INDICADORES</span></span><h1>Relatórios</h1><p>Acompanhe os resultados e as movimentações da sua organização.</p></div>
    <div className={reportStyles.headingTools}>
      <ReportFilters kind={kind} period={period} onKind={onKind} onPeriod={onPeriod} />
      <Button type="button" className={`${reportStyles.printButton} report-print-button`} onClick={onPreview} disabled={previewDisabled} startIcon={<Icon icon="mdi:file-eye-outline" width={20} height={20} />} sx={{ textTransform: 'none', boxShadow: 'none' }}>Pré-visualizar PDF</Button>
    </div>
  </header>;
}

function ReportSummary({ totals, loading }: { totals: Record<string, unknown>; loading: boolean }) {
  const entries = numericTotals(totals);
  if (!entries.length && loading) return <div className="report-summary" aria-label="Indicadores do relatório">{Array.from({ length: 3 }, (_, index) => <Paper component="article" elevation={0} className="report-total-card report-total-skeleton" key={index} sx={{ bgcolor: 'var(--card)', color: 'var(--ink)' }}><Typography component="span">Carregando indicador</Typography><Typography component="strong">—</Typography></Paper>)}</div>;
  return <div className="report-summary" aria-label="Indicadores do relatório">{entries.map(([key, value], index) => <Paper component="article" elevation={0} className="report-total-card" key={key} style={{ '--report-color': colors[index % colors.length] } as CSSProperties} sx={{ bgcolor: 'var(--card)', color: 'var(--ink)' }}>
    <span className="report-total-icon"><Icon icon={summaryIcons[key] ?? 'mdi:chart-box-outline'} width={22} height={22} /></span>
    <Typography component="span" className="report-total-label">{labels[key] ?? key.replaceAll('_', ' ')}</Typography>
    <Typography component="strong">{key.includes('valor') || key.includes('faturamento') || key.includes('descontos') ? money(value) : Number(value).toLocaleString('pt-BR')}</Typography>
  </Paper>)}</div>;
}

function ReportChart({ report, loading, period, kind, chartType, onChartType }: { report: Report | null; loading: boolean; period: string; kind: string; chartType: ChartType; onChartType: (value: ChartType) => void }) {
  const categorySeries = kind === 'produtos' ? report?.serie?.categorias ?? [] : [];
  const rawLabels = categorySeries.length ? categorySeries.map((item) => item.nome) : report?.serie?.rotulos ?? [];
  const rawValues = categorySeries.length ? categorySeries.map((item) => item.quantidade) : report?.serie?.valores ?? [];
  const groupedSeries = categorySeries.length
    ? rawLabels.map((label, index) => ({ label, value: Number(rawValues[index] ?? 0) }))
    : groupAdjacentEqualValues(rawLabels, rawValues, chartType === 'rosca');
  const labels = groupedSeries.map((item) => item.label);
  const values = groupedSeries.map((item) => item.value);
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
    </div> : chartType === 'area' ? <div className={`report-line-chart ${chartType}`} role="img" aria-label={`Gráfico ${chartType}: ${labels.map((label, index) => `${label}: ${Number(values[index] ?? 0).toLocaleString('pt-BR')}`).join('; ')}`}>
      <svg viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="report-line-gradient" x1="0" x2="1"><stop offset="0%" stopColor="#0875e1" /><stop offset="50%" stopColor="#09a878" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient><linearGradient id="report-area-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0875e1" stopOpacity=".35" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity=".03" /></linearGradient></defs>
        {[50, 105, 160, 215, 270].map((y) => <line key={y} x1="30" x2="970" y1={y} y2={y} className="report-grid-line" />)}
        {chartType === 'area' && <path d={areaPath} fill="url(#report-area-gradient)" stroke="#0875e1" strokeOpacity=".28" strokeWidth="2" />}
        <polyline points={linePoints} fill="none" stroke={chartType === 'area' ? '#0875e1' : 'url(#report-line-gradient)'} strokeWidth={chartType === 'area' ? '7' : '5'} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {values.map((_, index) => { const point = linePoints.split(' ')[index]?.split(',').map(Number) ?? [0, 0]; return <circle key={`${labels[index]}-${index}`} cx={point[0]} cy={point[1]} r={chartType === 'area' ? '5' : '6'} fill={chartType === 'area' ? '#0875e1' : colors[index % colors.length]} stroke="var(--card)" strokeWidth="3" />; })}
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
  const [previewHtml, setPreviewHtml] = useState('');
  const previewFrame = useRef<HTMLIFrameElement>(null);

  function openPreview() {
    if (report) setPreviewHtml(buildReportPreview(report, kind, period, chartType));
  }

  function printPreview() {
    const printWindow = previewFrame.current?.contentWindow;
    if (!printWindow) return;
    printWindow.focus();
    printWindow.print();
  }

  useEffect(() => {
    setLoading(true); setError('');
    apiFetch<unknown>(`/relatorios?periodo=${period}&tipo=${kind}`).then((response) => setReport(unwrap<Report>(response as never))).catch((reason) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o relatório.')).finally(() => setLoading(false));
  }, [period, kind]);

  useEffect(() => {
    if (!previewHtml) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewHtml('');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewHtml]);

  return <div className="clients-page reports-page">
    <ReportHeading kind={kind} period={period} onKind={setKind} onPeriod={setPeriod} onPreview={openPreview} previewDisabled={loading || !report} />
    {error && <div className="inline-error reports-inline-error">{error}</div>}
    <ReportSummary totals={report?.totais ?? {}} loading={loading} />
    <ReportChart report={report} loading={loading} period={period} kind={kind} chartType={chartType} onChartType={setChartType} />
    {previewHtml && <div className={reportStyles.previewBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewHtml(''); }}>
      <section className={reportStyles.previewDialog} role="dialog" aria-modal="true" aria-labelledby="report-preview-title">
        <header className={reportStyles.previewHeader}><div><span className="eyebrow">DOCUMENTO</span><h2 id="report-preview-title">Pré-visualização do relatório</h2></div><div className={reportStyles.previewActions}>
          <Button type="button" variant="outlined" className={reportStyles.closeButton} onClick={() => setPreviewHtml('')} startIcon={<Icon icon="mdi:arrow-left" width={18} height={18} />} sx={{ textTransform: 'none' }}>Voltar</Button>
          <Button type="button" className={reportStyles.printButton} onClick={printPreview} startIcon={<Icon icon="mdi:printer-outline" width={19} height={19} />} sx={{ textTransform: 'none', boxShadow: 'none' }}>Imprimir / salvar PDF</Button>
        </div></header>
        <iframe ref={previewFrame} title="Pré-visualização do relatório em PDF" srcDoc={previewHtml} className={reportStyles.previewFrame} />
      </section>
    </div>}
  </div>;
}

import React, { useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import * as Print from 'expo-print';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@context/types';
import { useTheme } from '@context/ThemeContext';
import Nav from '@components/utilities/Nav';
import { MetricCard } from '@components/reports/MetricCard';
import { ReportChart } from '@components/reports/ReportChart';
import TooltipChip from '@components/botoes/TooltipChip';
import Button from '@components/botoes/Button';
import { Text } from 'react-native-paper';
import { getRelatorio, RelatorioResponse } from '@api/apiRelatorios';
import Toast from 'react-native-toast-message';
import { formatErrorMessage } from '@core/utils/format';
import { REPORT_METRIC_COLORS } from '@components/reports/palette';

type Props = NativeStackScreenProps<RootStackParamList, 'Relatorios'>;
type ReportType = 'movimentacao' | 'orcamentos' | 'clientes' | 'produtos' | 'vendas';
type PeriodType = 'hoje' | 'semana' | 'mes' | 'ano';

const periods = [
  { id: 'hoje' as PeriodType, label: 'Hoje' },
  { id: 'semana' as PeriodType, label: 'Semana' },
  { id: 'mes' as PeriodType, label: 'Mês' },
  { id: 'ano' as PeriodType, label: 'Ano' },
];

const reportTypes: ReportType[] = ['vendas', 'orcamentos', 'clientes', 'produtos', 'movimentacao'];

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const paymentLabels: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  debito: 'Cartão de débito',
  credito: 'Cartão de crédito',
  nao_informado: 'Não informado',
};

const formatPaymentLabel = (value: string) => paymentLabels[value] ?? value.replace(/_/g, ' ');

const formatarDataCurta = (data: string) => {
  const [ano, mes, dia] = data.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

const obterDetalheErro = (error: unknown) => {
  const mensagemApi = formatErrorMessage(error, '');
  if (mensagemApi) return mensagemApi;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  if (error && typeof error === 'object') {
    const erroEstruturado = error as { message?: unknown; code?: unknown };
    if (typeof erroEstruturado.message === 'string' && erroEstruturado.message) return erroEstruturado.message;
    if (typeof erroEstruturado.code === 'string' && erroEstruturado.code) return erroEstruturado.code;
    const serializado = JSON.stringify(error);
    if (serializado && serializado !== '{}') return serializado;
  }
  return 'O dispositivo não retornou detalhes do erro.';
};

const imprimirHtmlNoNavegador = (html: string) => {
  const janela = window.open('', '_blank');
  if (!janela) {
    throw new Error('O navegador bloqueou a janela de impressão. Permita pop-ups para salvar o relatório em PDF.');
  }

  let impressaoIniciada = false;
  const iniciarImpressao = () => {
    if (impressaoIniciada) return;
    impressaoIniciada = true;
    janela.focus();
    janela.print();
  };

  janela.addEventListener('load', iniciarImpressao, { once: true });
  janela.addEventListener('afterprint', () => janela.close(), { once: true });
  janela.document.open();
  janela.document.write(html);
  janela.document.close();
  window.setTimeout(iniciarImpressao, 500);
};

const gerarHtmlRelatorio = (reports: Record<ReportType, RelatorioResponse>, periodo: PeriodType) => {
  const resumo = reports.vendas;
  const periodoLabel = periods.find((item) => item.id === periodo)?.label ?? periodo;
  const formatarVariacao = (value: number | null) => value == null
    ? 'Sem base de comparação'
    : `${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR')}% em relação ao período anterior`;
  const rows = (labels: string[], values: number[], formatValue: (value: number) => string = String) => {
    if (!labels.length) return '<tr><td colspan="2" class="empty">Nenhum registro neste período.</td></tr>';
    return labels.map((label, index) => `<tr><td>${escapeHtml(label)}</td><td class="number">${escapeHtml(formatValue(values[index] ?? 0))}</td></tr>`).join('');
  };
  const linhasVendas = reports.vendas.serie.rotulos_vendas.map((rotulo, index) => `<tr><td>${escapeHtml(rotulo)}</td><td class="number">${reports.vendas.serie.vendas[index] ?? 0}</td><td class="number">${formatCurrency(reports.vendas.serie.faturamento[index] ?? 0)}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">Nenhuma venda registrada neste período.</td></tr>';
  const formasPagamento = resumo.totais.formas_pagamento.map((item) => `<tr><td>${escapeHtml(formatPaymentLabel(item.forma))}</td><td class="number">${item.quantidade}</td><td class="number">${formatCurrency(item.valor)}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">Nenhuma forma de pagamento registrada.</td></tr>';
  const linhasProdutos = reports.produtos.serie.categorias.map((item) => `<tr><td>${escapeHtml(item.nome)}</td><td class="number">${item.quantidade}</td></tr>`).join('') || '<tr><td colspan="2" class="empty">Nenhum produto cadastrado neste período.</td></tr>';

  return `<!doctype html><html><head><meta charset="utf-8" /><title>Relatório Gestorize</title><style>
    @page { size: A4; margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #172033; font-size: 11px; line-height: 1.45; }
    .brand { color: #475569; font-size: 10px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; }
    h1 { margin: 5px 0 3px; font-size: 25px; color: #102a43; }
    .subtitle { color: #64748b; margin: 0; }
    .rule { height: 3px; background: #d6ad43; margin: 16px 0 20px; }
    .meta { display: flex; justify-content: space-between; color: #475569; margin-bottom: 16px; }
    .grid { display: flex; flex-wrap: wrap; gap: 9px; margin-bottom: 18px; }
    .metric { width: 32%; border: 1px solid #dbe2ea; border-radius: 8px; padding: 12px; }
    .metric-label { color: #64748b; font-size: 10px; }
    .metric-value { font-size: 17px; font-weight: bold; margin: 5px 0 3px; color: #102a43; }
    .metric-change { font-size: 9px; color: #64748b; }
    h2 { font-size: 15px; color: #102a43; margin: 20px 0 8px; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #f1f5f9; text-align: left; color: #475569; font-size: 9px; text-transform: uppercase; }
    th, td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    .number { text-align: right; white-space: nowrap; font-weight: bold; }
    .empty { color: #64748b; text-align: center; padding: 20px; }
    .note { background: #f8fafc; border-left: 3px solid #c69f36; padding: 10px 12px; margin-top: 18px; color: #475569; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 24px; color: #94a3b8; font-size: 9px; }
    .section-caption { color: #64748b; margin: -3px 0 8px; }
  </style></head><body>
    <div class="brand">Gestorize · Relatórios</div>
    <h1>Relatório consolidado</h1>
    <p class="subtitle">Vendas, clientes, orçamentos e produtos</p>
    <div class="rule"></div>
    <div class="meta"><span>Período: <strong>${escapeHtml(periodoLabel)} · ${formatarDataCurta(resumo.intervalo.inicio)} a ${formatarDataCurta(resumo.intervalo.fim)}</strong></span><span>Gerado em: ${new Date().toLocaleString('pt-BR')}</span></div>
    <div class="grid">
      <div class="metric"><div class="metric-label">Valor em orçamentos</div><div class="metric-value">${formatCurrency(resumo.metricas.valor_orcado.valor)}</div><div class="metric-change">${escapeHtml(formatarVariacao(resumo.metricas.valor_orcado.variacao))}</div></div>
      <div class="metric"><div class="metric-label">Orçamentos criados</div><div class="metric-value">${resumo.metricas.orcamentos.valor}</div><div class="metric-change">${escapeHtml(formatarVariacao(resumo.metricas.orcamentos.variacao))}</div></div>
      <div class="metric"><div class="metric-label">Novos clientes</div><div class="metric-value">${resumo.metricas.clientes.valor}</div><div class="metric-change">${escapeHtml(formatarVariacao(resumo.metricas.clientes.variacao))}</div></div>
      <div class="metric"><div class="metric-label">Vendas concluídas</div><div class="metric-value">${resumo.metricas.vendas.valor}</div><div class="metric-change">${escapeHtml(formatarVariacao(resumo.metricas.vendas.variacao))}</div></div>
      <div class="metric"><div class="metric-label">Faturamento de vendas</div><div class="metric-value">${formatCurrency(resumo.metricas.faturamento_vendas.valor)}</div><div class="metric-change">${escapeHtml(formatarVariacao(resumo.metricas.faturamento_vendas.variacao))}</div></div>
    </div>
    <h2>Resumo do período</h2>
    <table><tbody>
      <tr><td>Orçamentos criados</td><td class="number">${resumo.totais.orcamentos}</td></tr>
      <tr><td>Aprovações realizadas</td><td class="number">${resumo.totais.aprovacoes}</td></tr>
      <tr><td>Orçamentos pendentes</td><td class="number">${resumo.totais.pendentes}</td></tr>
      <tr><td>Produtos cadastrados no período</td><td class="number">${resumo.totais.produtos}</td></tr>
      <tr><td>Vendas concluídas</td><td class="number">${resumo.totais.vendas}</td></tr>
      <tr><td>Faturamento líquido das vendas</td><td class="number">${formatCurrency(resumo.totais.faturamento_vendas)}</td></tr>
      <tr><td>Descontos concedidos nas vendas</td><td class="number">${formatCurrency(resumo.totais.descontos_vendas)}</td></tr>
    </tbody></table>
    <h2>Vendas por período</h2>
    <p class="section-caption">Quantidade de vendas concluídas e faturamento líquido registrado em cada intervalo.</p>
    <table><thead><tr><th>Intervalo</th><th class="number">Vendas</th><th class="number">Faturamento</th></tr></thead><tbody>${linhasVendas}</tbody></table>
    <h2>Vendas por forma de pagamento</h2>
    <table><thead><tr><th>Forma</th><th class="number">Vendas</th><th class="number">Faturamento</th></tr></thead><tbody>${formasPagamento}</tbody></table>
    <h2>Orçamentos por período</h2>
    <table><thead><tr><th>Intervalo</th><th class="number">Valor orçado</th></tr></thead><tbody>${rows(reports.movimentacao.serie.rotulos, reports.movimentacao.serie.valores, formatCurrency)}</tbody></table>
    <h2>Orçamentos criados por período</h2>
    <table><thead><tr><th>Intervalo</th><th class="number">Quantidade</th></tr></thead><tbody>${rows(reports.orcamentos.serie.rotulos, reports.orcamentos.serie.valores)}</tbody></table>
    <h2>Novos clientes por período</h2>
    <table><thead><tr><th>Intervalo</th><th class="number">Quantidade</th></tr></thead><tbody>${rows(reports.clientes.serie.rotulos, reports.clientes.serie.valores)}</tbody></table>
    <h2>Produtos cadastrados no período por categoria</h2>
    <table><thead><tr><th>Categoria</th><th class="number">Produtos</th></tr></thead><tbody>${linhasProdutos}</tbody></table>
    <div class="note">Faturamento considera o valor líquido das vendas após a aplicação dos descontos.</div>
    <div class="footer">Documento gerado pelo Gestorize com base nos dados registrados até o momento da emissão.</div>
  </body></html>`;
};

const Relatorios = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('hoje');
  const [reports, setReports] = useState<Record<ReportType, RelatorioResponse> | null>(null);
  const report = reports?.vendas ?? null;
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    setReports(null);
    Promise.all(reportTypes.map((type) => getRelatorio(selectedPeriod, type)))
      .then((data) => {
        if (!active) return;
        const complete = reportTypes.reduce((result, type, index) => {
          result[type] = data[index];
          return result;
        }, {} as Record<ReportType, RelatorioResponse>);
        setReports(complete);
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(formatErrorMessage(error, 'Não foi possível carregar os dados do relatório.'));
        Toast.show({ type: 'error', text1: 'Erro ao carregar relatório', text2: formatErrorMessage(error, 'Tente novamente.') });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedPeriod]);

  const moeda = formatCurrency;
  const dateRange = report
    ? `${formatarDataCurta(report.intervalo.inicio)} a ${formatarDataCurta(report.intervalo.fim)}`
    : undefined;

  const gerarPdfRelatorio = useCallback(async () => {
    if (!reports) return;

    setPdfLoading(true);
    let etapa = 'Preparar o relatório';
    try {
      const html = gerarHtmlRelatorio(reports, selectedPeriod);

      // No navegador, criamos a janela com o HTML do relatório para imprimir/salvar como PDF.
      if (Platform.OS === 'web') {
        etapa = 'Abrir a impressão do navegador';
        imprimirHtmlNoNavegador(html);
        return;
      }

      etapa = 'Abrir a impressão do relatório';
      await Print.printAsync({ html });
    } catch (error) {
      const detalhe = obterDetalheErro(error);
      Toast.show({
        type: 'error',
        text1: etapa,
        text2: detalhe.length > 180 ? `${detalhe.slice(0, 177)}...` : detalhe,
      });
    } finally {
      setPdfLoading(false);
    }
  }, [reports, selectedPeriod]);

  const handlePeriodChange = useCallback((period: PeriodType) => {
    setSelectedPeriod(period);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Nav
        title="Relatórios"
        subtitle="Análise de métricas e indicadores"
        onBackPress={() => navigation.goBack()}
        rightType="download"
        onDownloadPress={gerarPdfRelatorio}
      />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Período
          </Text>

          <FlatList
            data={periods}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipContainer}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TooltipChip
                label={item.label}
                active={selectedPeriod === item.id}
                onPress={() => handlePeriodChange(item.id)}
              />
            )}
          />
        </View>

        {report && reports && <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Visão geral</Text>
          <View style={styles.metricsGrid}>
            <MetricCard value={moeda(report.metricas.valor_orcado.valor)} change={report.metricas.valor_orcado.variacao} title="Valor em orçamentos" icon="currency-brl" iconColor={REPORT_METRIC_COLORS.orcamentos} />
            <MetricCard value={String(report.metricas.orcamentos.valor)} change={report.metricas.orcamentos.variacao} title="Orçamentos criados" icon="file-document-outline" iconColor={REPORT_METRIC_COLORS.orcamentos} />
            <MetricCard value={String(report.metricas.clientes.valor)} change={report.metricas.clientes.variacao} title="Clientes novos" icon="account-group" iconColor={REPORT_METRIC_COLORS.clientes} />
            <MetricCard value={String(report.metricas.vendas.valor)} change={report.metricas.vendas.variacao} title="Vendas concluídas" icon="cart-check" iconColor={REPORT_METRIC_COLORS.vendas} />
            <MetricCard value={moeda(report.metricas.faturamento_vendas.valor)} change={report.metricas.faturamento_vendas.variacao} title="Faturamento de vendas" icon="cash-multiple" iconColor={REPORT_METRIC_COLORS.faturamento} />
            <MetricCard value={String(reports.produtos.totais.produtos)} change={null} title="Produtos novos no período" icon="package-variant" iconColor={REPORT_METRIC_COLORS.produtos} />
          </View>
        </>}

        {loading && <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />}
        {!loading && loadError && <Text style={[styles.message, { color: colors.error }]}>{loadError}</Text>}
        {!loading && reports && report && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Vendas</Text>
            <ReportChart
              type="vendas"
              data={{ labels: report.serie.rotulos_vendas, datasets: [{ data: report.serie.vendas }] }}
              total={`${report.totais.vendas} vendas concluídas`}
              dateRange={dateRange}
            />
            <ReportChart
              type="faturamento"
              data={{ labels: report.serie.rotulos_vendas, datasets: [{ data: report.serie.faturamento }] }}
              total={`${moeda(report.totais.faturamento_vendas)} em faturamento líquido`}
              dateRange={dateRange}
            />
            <View style={[styles.salesBreakdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.breakdownTitle, { color: colors.text }]}>Vendas por forma de pagamento</Text>
              {report.totais.formas_pagamento.length ? report.totais.formas_pagamento.map((item) => (
                <View key={item.forma} style={[styles.breakdownRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.breakdownLabel, { color: colors.text }]}>{formatPaymentLabel(item.forma)}</Text>
                  <Text style={[styles.breakdownValue, { color: colors.muted }]}>{item.quantidade} · {moeda(item.valor)}</Text>
                </View>
              )) : <Text style={[styles.breakdownEmpty, { color: colors.muted }]}>Nenhuma venda registrada neste período.</Text>}
              <View style={[styles.breakdownRow, styles.breakdownLastRow]}>
                <Text style={[styles.breakdownLabel, { color: colors.text }]}>Descontos concedidos</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>{moeda(report.totais.descontos_vendas)}</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Orçamentos</Text>
            <View style={styles.metricsGrid}>
              <MetricCard value={moeda(reports.movimentacao.totais.valor_orcado)} change={reports.movimentacao.metricas.valor_orcado.variacao} title="Valor orçado" icon="currency-brl" iconColor={REPORT_METRIC_COLORS.orcamentos} />
              <MetricCard value={String(reports.orcamentos.totais.orcamentos)} change={reports.orcamentos.metricas.orcamentos.variacao} title="Criados no período" icon="file-document-outline" iconColor={REPORT_METRIC_COLORS.orcamentos} />
              <MetricCard value={String(reports.orcamentos.totais.aprovacoes)} change={null} title="Aprovados" icon="check-circle-outline" iconColor={REPORT_METRIC_COLORS.aprovados} />
              <MetricCard value={String(reports.orcamentos.totais.pendentes)} change={null} title="Pendentes" icon="clock-outline" iconColor={REPORT_METRIC_COLORS.pendentes} />
            </View>
            <ReportChart
              type="movimentacao"
              data={{ labels: reports.movimentacao.serie.rotulos, datasets: [{ data: reports.movimentacao.serie.valores }] }}
              total={`${moeda(reports.movimentacao.totais.valor_orcado)} em orçamentos`}
              dateRange={dateRange}
            />
            <ReportChart
              type="orcamentos"
              data={{ labels: reports.orcamentos.serie.rotulos, datasets: [{ data: reports.orcamentos.serie.valores }] }}
              total={`${reports.orcamentos.totais.orcamentos} orçamentos criados`}
              dateRange={dateRange}
            />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Clientes</Text>
            <View style={styles.metricsGrid}>
              <MetricCard value={String(reports.clientes.totais.clientes)} change={reports.clientes.metricas.clientes.variacao} title="Novos clientes" icon="account-group" iconColor={REPORT_METRIC_COLORS.clientes} />
            </View>
            <ReportChart
              type="clientes"
              data={{ labels: reports.clientes.serie.rotulos, datasets: [{ data: reports.clientes.serie.valores }] }}
              total={`${reports.clientes.totais.clientes} novos clientes`}
              dateRange={dateRange}
            />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Produtos</Text>
            <ReportChart
              type="produtos"
              data={reports.produtos.serie.categorias.map((categoria) => ({
                name: categoria.nome,
                quantity: categoria.quantidade,
              }))}
              total={`${reports.produtos.totais.produtos} produtos cadastrados no período`}
              dateRange={dateRange}
            />
          </>
        )}

        {report && <Text style={[styles.note, { color: colors.muted }]}>{report.nota}</Text>}

        <View style={styles.buttonContainer}>
          <Button
            title={pdfLoading ? 'Preparando relatório...' : Platform.OS === 'web' ? 'Salvar relatório em PDF' : 'Imprimir ou salvar em PDF'}
            variant="contained"
            color="primary"
            onPress={gerarPdfRelatorio}
            disabled={!reports || loading || pdfLoading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Relatorios;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 10 ,
    paddingHorizontal: 20,
  },
  chipContainer: {
    gap: 12,
    paddingHorizontal: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  loader: { marginVertical: 32 },
  message: { marginHorizontal: 20, marginBottom: 20, textAlign: 'center' },
  note: { marginHorizontal: 20, marginTop: 4, marginBottom: 20, fontSize: 12, lineHeight: 18 },
  salesBreakdown: { marginHorizontal: 20, marginBottom: 24, padding: 16, borderWidth: 1, borderRadius: 16 },
  breakdownTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  breakdownRow: { minHeight: 42, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  breakdownLastRow: { borderBottomWidth: 0, marginTop: 4 },
  breakdownLabel: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize', flex: 1 },
  breakdownValue: { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  breakdownEmpty: { paddingVertical: 12, fontSize: 14 },
});

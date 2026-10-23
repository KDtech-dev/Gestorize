import React, { useRef, useState, useMemo, useCallback } from 'react';
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

const formatPaymentLabel = (value: string) => ({
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  debito: 'Cartão de débito',
  credito: 'Cartão de crédito',
  nao_informado: 'Não informado',
}[value] ?? value.replace(/_/g, ' '));

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

const gerarHtmlRelatorio = (report: RelatorioResponse, periodo: PeriodType, tipo: ReportType) => {
  const periodoLabel = periods.find((item) => item.id === periodo)?.label ?? periodo;
  const tipoLabel = reportTypes.find((item) => item.id === tipo)?.label ?? tipo;
  const isProdutos = tipo === 'produtos';
  const linhas = isProdutos
    ? report.serie.categorias.map((item) => ({ rotulo: item.nome, valor: item.quantidade }))
    : report.serie.rotulos.map((rotulo, index) => ({ rotulo, valor: report.serie.valores[index] ?? 0 }));
  const maxValor = Math.max(...linhas.map((item) => item.valor), 0);
  const formatarValor = (value: number) => tipo === 'movimentacao' ? formatCurrency(value) : String(value);
  const formatarVariacao = (value: number | null) => value == null
    ? 'Sem base de comparação'
    : `${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR')}% em relação ao período anterior`;
  const linhaTabela = linhas.length
    ? linhas.map((item) => {
      const largura = maxValor > 0 ? Math.max((item.valor / maxValor) * 100, item.valor > 0 ? 2 : 0) : 0;
      return `<tr><td>${escapeHtml(item.rotulo)}</td><td class="number">${escapeHtml(formatarValor(item.valor))}</td><td><div class="track"><div class="bar" style="width:${largura}%"></div></div></td></tr>`;
    }).join('')
    : '<tr><td colspan="3" class="empty">Nenhum registro neste período.</td></tr>';
  const serieVendas = report.serie.rotulos_vendas.map((rotulo, index) => ({
    rotulo,
    quantidade: report.serie.vendas[index] ?? 0,
    faturamento: report.serie.faturamento[index] ?? 0,
  }));
  const linhasVendas = serieVendas.length
    ? serieVendas.map((item) => `<tr><td>${escapeHtml(item.rotulo)}</td><td class="number">${item.quantidade}</td><td class="number">${formatCurrency(item.faturamento)}</td></tr>`).join('')
    : '<tr><td colspan="3" class="empty">Nenhuma venda registrada neste período.</td></tr>';
  const formasPagamento = report.totais.formas_pagamento.length
    ? report.totais.formas_pagamento.map((item) => `<tr><td>${escapeHtml(formatPaymentLabel(item.forma))}</td><td class="number">${item.quantidade}</td><td class="number">${formatCurrency(item.valor)}</td></tr>`).join('')
    : '<tr><td colspan="3" class="empty">Nenhuma forma de pagamento registrada.</td></tr>';

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
    .track { height: 7px; background: #edf1f5; border-radius: 5px; overflow: hidden; }
    .bar { height: 7px; background: #c69f36; border-radius: 5px; }
    .empty { color: #64748b; text-align: center; padding: 20px; }
    .note { background: #f8fafc; border-left: 3px solid #c69f36; padding: 10px 12px; margin-top: 18px; color: #475569; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 24px; color: #94a3b8; font-size: 9px; }
    .section-caption { color: #64748b; margin: -3px 0 8px; }
  </style></head><body>
    <div class="brand">Gestorize · Relatórios</div>
    <h1>${escapeHtml(tipoLabel)}</h1>
    <p class="subtitle">Resumo das movimentações registradas no sistema</p>
    <div class="rule"></div>
    <div class="meta"><span>Período: <strong>${escapeHtml(periodoLabel)} · ${formatarDataCurta(report.intervalo.inicio)} a ${formatarDataCurta(report.intervalo.fim)}</strong></span><span>Gerado em: ${new Date().toLocaleString('pt-BR')}</span></div>
    <div class="grid">
      <div class="metric"><div class="metric-label">Valor em orçamentos</div><div class="metric-value">${formatCurrency(report.metricas.valor_orcado.valor)}</div><div class="metric-change">${escapeHtml(formatarVariacao(report.metricas.valor_orcado.variacao))}</div></div>
      <div class="metric"><div class="metric-label">Orçamentos criados</div><div class="metric-value">${report.metricas.orcamentos.valor}</div><div class="metric-change">${escapeHtml(formatarVariacao(report.metricas.orcamentos.variacao))}</div></div>
      <div class="metric"><div class="metric-label">Novos clientes</div><div class="metric-value">${report.metricas.clientes.valor}</div><div class="metric-change">${escapeHtml(formatarVariacao(report.metricas.clientes.variacao))}</div></div>
      <div class="metric"><div class="metric-label">Vendas concluídas</div><div class="metric-value">${report.metricas.vendas.valor}</div><div class="metric-change">${escapeHtml(formatarVariacao(report.metricas.vendas.variacao))}</div></div>
      <div class="metric"><div class="metric-label">Faturamento de vendas</div><div class="metric-value">${formatCurrency(report.metricas.faturamento_vendas.valor)}</div><div class="metric-change">${escapeHtml(formatarVariacao(report.metricas.faturamento_vendas.variacao))}</div></div>
    </div>
    <h2>Resumo do período</h2>
    <table><tbody>
      <tr><td>Orçamentos criados</td><td class="number">${report.totais.orcamentos}</td></tr>
      <tr><td>Aprovações realizadas</td><td class="number">${report.totais.aprovacoes}</td></tr>
      <tr><td>Orçamentos pendentes</td><td class="number">${report.totais.pendentes}</td></tr>
      <tr><td>Produtos cadastrados</td><td class="number">${report.totais.produtos}</td></tr>
      <tr><td>Vendas concluídas</td><td class="number">${report.totais.vendas}</td></tr>
      <tr><td>Faturamento líquido das vendas</td><td class="number">${formatCurrency(report.totais.faturamento_vendas)}</td></tr>
      <tr><td>Descontos concedidos nas vendas</td><td class="number">${formatCurrency(report.totais.descontos_vendas)}</td></tr>
    </tbody></table>
    <h2>Vendas por período</h2>
    <p class="section-caption">Quantidade de vendas concluídas e faturamento líquido registrado em cada intervalo.</p>
    <table><thead><tr><th>Intervalo</th><th class="number">Vendas</th><th class="number">Faturamento</th></tr></thead><tbody>${linhasVendas}</tbody></table>
    <h2>Vendas por forma de pagamento</h2>
    <table><thead><tr><th>Forma</th><th class="number">Vendas</th><th class="number">Faturamento</th></tr></thead><tbody>${formasPagamento}</tbody></table>
    <h2>${isProdutos ? 'Produtos cadastrados por categoria' : tipo === 'movimentacao' ? 'Valor em orçamentos por período' : tipo === 'orcamentos' ? 'Orçamentos criados por período' : tipo === 'vendas' ? 'Vendas concluídas por período' : 'Novos clientes por período'}</h2>
    <table><thead><tr><th>${isProdutos ? 'Categoria' : 'Intervalo'}</th><th class="number">${tipo === 'movimentacao' ? 'Valor' : 'Quantidade'}</th><th>Distribuição</th></tr></thead><tbody>${linhaTabela}</tbody></table>
    <div class="note">${escapeHtml(report.nota)}</div>
    <div class="footer">Documento gerado pelo Gestorize com base nos dados registrados até o momento da emissão.</div>
  </body></html>`;
};

const Relatorios = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('hoje');
  const [selectedReportType, setSelectedReportType] =
    useState<ReportType>('vendas');
  const [report, setReport] = useState<RelatorioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    setReport(null);
    getRelatorio(selectedPeriod, selectedReportType)
      .then((data) => { if (active) setReport(data); })
      .catch((error) => {
        if (!active) return;
        setLoadError(formatErrorMessage(error, 'Não foi possível carregar os dados do relatório.'));
        Toast.show({ type: 'error', text1: 'Erro ao carregar relatório', text2: formatErrorMessage(error, 'Tente novamente.') });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedPeriod, selectedReportType]);

  const chartData = useMemo(() => {
    if (!report) return null;
    switch (selectedReportType) {
      case 'movimentacao':
        return {
          data: {
            labels: report.serie.rotulos,
            datasets: [{ data: report.serie.valores }],
          },
          total: `${report.totais.valor_orcado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em orçamentos`,
        };
      case 'orcamentos':
        return {
          data: {
            labels: report.serie.rotulos,
            datasets: [{ data: report.serie.valores }],
          },
          total: `${report.totais.orcamentos} criados · ${report.totais.aprovacoes} aprovações no período · ${report.totais.pendentes} pendentes`,
        };
      case 'clientes':
        return {
          data: {
            labels: report.serie.rotulos,
            datasets: [{ data: report.serie.valores }],
          },
          total: `${report.totais.clientes} novos clientes`,
        };
      case 'vendas':
        return {
          data: { labels: report.serie.rotulos, datasets: [{ data: report.serie.vendas }] },
          total: `${report.totais.vendas} vendas concluídas · ${formatCurrency(report.totais.faturamento_vendas)} faturados`,
        };
      case 'produtos':
        return {
          data: report.serie.categorias.map((categoria, index) => ({
            name: categoria.nome,
            quantity: categoria.quantidade,
            color: [colors.accent, colors.success, colors.primary, colors.error, '#64748B'][index % 5],
            legendFontColor: colors.muted,
            legendFontSize: 12,
          })),
          total: `${report.totais.produtos} produtos cadastrados`,
        };
      default:
        return null;
    }
  }, [selectedReportType, report, colors]);

  const moeda = formatCurrency;
  const dateRange = report
    ? `${formatarDataCurta(report.intervalo.inicio)} a ${formatarDataCurta(report.intervalo.fim)}`
    : undefined;

  const gerarPdfRelatorio = useCallback(async () => {
    if (!report) return;

    setPdfLoading(true);
    let etapa = 'Preparar o relatório';
    try {
      const html = gerarHtmlRelatorio(report, selectedPeriod, selectedReportType);

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
  }, [report, selectedPeriod, selectedReportType]);

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

        {report && <View style={styles.metricsGrid}>
          <MetricCard value={moeda(report.metricas.valor_orcado.valor)} change={report.metricas.valor_orcado.variacao} title="Valor em orçamentos" icon="currency-brl" iconColor={colors.success} />
          <MetricCard value={String(report.metricas.orcamentos.valor)} change={report.metricas.orcamentos.variacao} title="Orçamentos criados" icon="file-document-outline" />
          <MetricCard value={String(report.metricas.clientes.valor)} change={report.metricas.clientes.variacao} title="Clientes novos" icon="account-group" />
          <MetricCard value={String(report.metricas.vendas.valor)} change={report.metricas.vendas.variacao} title="Vendas concluídas" icon="cart-check" iconColor={colors.primary} />
          <MetricCard value={moeda(report.metricas.faturamento_vendas.valor)} change={report.metricas.faturamento_vendas.variacao} title="Faturamento de vendas" icon="cash-multiple" iconColor={colors.success} />
        </View>}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Tipo de Relatório
          </Text>

          <FlatList
            data={reportTypes}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipContainer}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TooltipChip
                label={item.label}
                active={selectedReportType === item.id}
                onPress={() => setSelectedReportType(item.id)}
              />
            )}
          />
        </View>

        {loading && <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />}
        {!loading && loadError && <Text style={[styles.message, { color: colors.error }]}>{loadError}</Text>}
        {!loading && chartData && report && (
          <ReportChart
            type={selectedReportType}
            data={chartData.data}
            total={chartData.total}
            dateRange={dateRange}
          />
        )}

        {!loading && selectedReportType === 'vendas' && report && (
          <>
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
          </>
        )}

        {report && <Text style={[styles.note, { color: colors.muted }]}>{report.nota}</Text>}

        <View style={styles.buttonContainer}>
          <Button
            title={pdfLoading ? 'Preparando relatório...' : Platform.OS === 'web' ? 'Salvar relatório em PDF' : 'Imprimir ou salvar em PDF'}
            variant="contained"
            color="primary"
            onPress={gerarPdfRelatorio}
            disabled={!report || loading || pdfLoading}
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

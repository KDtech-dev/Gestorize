import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Share,
} from 'react-native';
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
type ReportType = 'movimentacao' | 'orcamentos' | 'clientes' | 'produtos';
type PeriodType = 'hoje' | 'semana' | 'mes' | 'ano';

const periods = [
  { id: 'hoje' as PeriodType, label: 'Hoje' },
  { id: 'semana' as PeriodType, label: 'Semana' },
  { id: 'mes' as PeriodType, label: 'Mês' },
  { id: 'ano' as PeriodType, label: 'Ano' },
];

const reportTypes = [
  { id: 'movimentacao' as ReportType, label: 'Movimentação' },
  { id: 'orcamentos' as ReportType, label: 'Orçamentos' },
  { id: 'clientes' as ReportType, label: 'Clientes' },
  { id: 'produtos' as ReportType, label: 'Produtos' },
];

const Relatorios = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('hoje');
  const [selectedReportType, setSelectedReportType] =
    useState<ReportType>('movimentacao');
  const [report, setReport] = useState<RelatorioResponse | null>(null);
  const [loading, setLoading] = useState(true);
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

  const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const compartilharRelatorio = useCallback(async () => {
    if (!report) return;

    const periodoLabel = periods.find((item) => item.id === selectedPeriod)?.label ?? selectedPeriod;
    const resumo = [
      `Relatório Gestorize — ${periodoLabel}`,
      `Valor em orçamentos: ${moeda(report.totais.valor_orcado)}`,
      `Orçamentos criados: ${report.totais.orcamentos}`,
      `Aprovações no período: ${report.totais.aprovacoes}`,
      `Orçamentos pendentes: ${report.totais.pendentes}`,
      `Novos clientes: ${report.totais.clientes}`,
      `Produtos cadastrados: ${report.totais.produtos}`,
      report.nota,
    ].join('\n');

    try {
      await Share.share({ title: 'Relatório Gestorize', message: resumo });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Não foi possível compartilhar o relatório' });
    }
  }, [report, selectedPeriod]);

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
        rightType="share"
        onDownloadPress={compartilharRelatorio}
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
          />
        )}

        {report && <Text style={[styles.note, { color: colors.muted }]}>{report.nota}</Text>}

        <View style={styles.buttonContainer}>
          <Button
            title="Compartilhar Relatório"
            variant="contained"
            color="primary"
            onPress={compartilharRelatorio}
            disabled={!report || loading}
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
    gap: 12,
    marginBottom: 24,
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  loader: { marginVertical: 32 },
  message: { marginHorizontal: 20, marginBottom: 20, textAlign: 'center' },
  note: { marginHorizontal: 20, marginTop: 4, marginBottom: 20, fontSize: 12, lineHeight: 18 },
});

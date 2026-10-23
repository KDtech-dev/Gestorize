import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '@context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

type ReportChartProps = {
  type: 'movimentacao' | 'orcamentos' | 'clientes' | 'produtos' | 'vendas' | 'faturamento';
  data: any;
  total?: string;
  dateRange?: string;
};

export const ReportChart = ({ type, data, total, dateRange }: ReportChartProps) => {
  const { colors, isDark } = useTheme();

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => {
      return isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(13, 43, 82, ${opacity})`;
    },
    labelColor: (opacity = 1) => {
      return isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`;
    },
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      stroke: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    },
  };

  const renderChart = () => {
    const hasData = type === 'produtos'
      ? Array.isArray(data) && data.some((item) => item.quantity > 0)
      : Array.isArray(data?.datasets?.[0]?.data) && data.datasets[0].data.some((value: number) => value > 0);

    if (!hasData) {
      const title = type === 'movimentacao'
        ? 'Valor em orçamentos por período'
        : type === 'orcamentos'
          ? 'Orçamentos criados por período'
          : type === 'clientes'
            ? 'Novos clientes por período'
            : type === 'vendas' ? 'Vendas concluídas por período' : type === 'faturamento' ? 'Faturamento de vendas por período' : 'Produtos cadastrados por categoria';
      return <View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {dateRange ? <Text style={[styles.dateRange, { color: colors.muted }]}>{dateRange}</Text> : null}
        <Text style={[styles.empty, { color: colors.muted }]}>Nenhuma movimentação registrada neste período.</Text>
      </View>;
    }

    switch (type) {
      case 'movimentacao':
      case 'orcamentos':
      case 'faturamento':
        return (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              {type === 'movimentacao' ? 'Valor em orçamentos por período' : type === 'faturamento' ? 'Faturamento de vendas por período' : 'Orçamentos criados por período'}
            </Text>
            {dateRange ? <Text style={[styles.dateRange, { color: colors.muted }]}>{dateRange}</Text> : null}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartScrollContainer}
            >
              <LineChart
                data={data}
                width={Math.max(screenWidth - 40, data.labels.length * 70)}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                formatYLabel={(value) => type === 'movimentacao' || type === 'faturamento' ? `R$ ${value}` : value}
                verticalLabelRotation={0}
                fromZero
              />
            </ScrollView>
          </>
        );
      case 'clientes':
      case 'vendas':
        return (
          <>
            <Text style={[styles.title, { color: colors.text }]}>{type === 'vendas' ? 'Vendas concluídas por período' : 'Novos clientes por período'}</Text>
            {dateRange ? <Text style={[styles.dateRange, { color: colors.muted }]}>{dateRange}</Text> : null}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartScrollContainer}
            >
              <BarChart
                data={data}
                width={Math.max(screenWidth - 40, data.labels.length * 70)}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                showValuesOnTopOfBars
                verticalLabelRotation={0}
              />
            </ScrollView>
          </>
        );
      case 'produtos':
        return (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Produtos cadastrados por categoria</Text>
            {dateRange ? <Text style={[styles.dateRange, { color: colors.muted }]}>{dateRange}</Text> : null}
            <View style={styles.pieChartContainer}>
              <PieChart
                data={data}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                accessor="quantity"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                style={styles.chart}
              />
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {renderChart()}
      {total && (
        <View style={[styles.totalContainer, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.muted }]}>Total:</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>{total}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateRange: {
    marginTop: -7,
    marginBottom: 8,
    paddingHorizontal: 20,
    fontSize: 12,
  },
  chartScrollContainer: {
    paddingRight: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  empty: { textAlign: 'center', fontSize: 14, paddingVertical: 24 },
});

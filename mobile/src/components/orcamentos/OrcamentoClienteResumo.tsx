import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrcamentoResumoType } from '@context/types';
import { formatMoney } from '@core/utils/format';
import { useTheme } from '@context/ThemeContext';

type Props = { orcamento: OrcamentoResumoType };

const OrcamentoClienteResumo = ({ orcamento }: Props) => {
  const { colors } = useTheme();
  const aprovado = orcamento.status === 'aprovado';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border ?? '#dbe2ea' }]}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.text }]}>{orcamento.titulo}</Text>
        <View style={[styles.status, { backgroundColor: aprovado ? '#dcfce7' : '#fef3c7' }]}>
          <Ionicons name={aprovado ? 'checkmark-circle' : 'time-outline'} size={14} color={aprovado ? '#15803d' : '#b45309'} />
          <Text style={[styles.statusText, { color: aprovado ? '#15803d' : '#b45309' }]}>{aprovado ? 'Aprovado' : 'Pendente'}</Text>
        </View>
      </View>
      <Text style={[styles.details, { color: colors.muted }]}>
        {formatMoney(Number(orcamento.valor_total))} · {new Date(`${orcamento.data_orcamento}T00:00:00`).toLocaleDateString('pt-BR')}
      </Text>
    </View>
  );
};

export default OrcamentoClienteResumo;

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 9 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '800' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '800' },
  details: { fontSize: 13, marginTop: 7 },
});

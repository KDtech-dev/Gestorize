import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeToggle } from '@context/ThemeContext';

type props = {
  title: string;
  cliente: string;
  valor: number;
  status: 'pendente' | 'aprovado' | 'vendido';
  onPress?: () => void;
};

const Orcamento = ({ title, cliente, valor, status, onPress }: props) => {
  const { colors } = useTheme();
  const { compactLists } = useThemeToggle();
  const isDark = colors.background !== '#ffffff';

  const cardBg = colors.card;
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subText = isDark ? '#cbd5e1' : '#6b7280';

  const circleColor = isDark ? colors.elevated : 'rgba(6, 32, 70, 0.12)';
  const arrowColor = isDark ? '#ffffff' : '#062046';
  const statusColor = status === 'vendido'
    ? (isDark ? '#bfdbfe' : '#1d4ed8')
    : isDark
      ? (status === 'aprovado' ? '#bbf7d0' : '#fde68a')
      : (status === 'aprovado' ? '#15803d' : '#b45309');
  const valorFormatado = Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View
        style={[
          styles.card,
          compactLists && styles.cardCompact,
          {
            backgroundColor: cardBg,
            shadowColor: isDark ? '#ffffff' : '#000000',
            shadowOpacity: isDark ? 0.08 : 0.12,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
          <View style={styles.left}>
          <View
            style={[
              styles.circle,
              compactLists && styles.circleCompact,
              { backgroundColor: circleColor },
            ]}
          >
            <Ionicons
              name="cart-outline"
              size={compactLists ? 25 : 30}
              color={isDark ? '#ffffff' : '#062046'}
            />
          </View>

          <View style={styles.details}>
            <View style={styles.statusLine}>
              <Ionicons name={status === 'vendido' ? 'cart' : status === 'aprovado' ? 'checkmark-circle' : 'time-outline'} size={13} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {status === 'vendido' ? 'Vendido' : status === 'aprovado' ? 'Aprovado' : 'Pendente'}
              </Text>
            </View>

            <Text
              numberOfLines={1}
              style={[
                styles.title,
                compactLists && styles.titleCompact,
                { color: textColor },
              ]}
            >
              {title}
            </Text>

            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={14} color={subText} />
              <Text numberOfLines={1} style={[styles.clientText, { color: subText }]}>
                {cliente}
              </Text>
            </View>

            <View style={styles.valueLine}>
              <Ionicons name="cash-outline" size={14} color={colors.primary} />
              <Text numberOfLines={1} style={[styles.valueText, { color: colors.primary }]}>
                {valorFormatado}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={22} color={arrowColor} />
      </View>
    </TouchableOpacity>
  );
};

export default Orcamento;
const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowRadius: 10,
    elevation: 3,
  },
  cardCompact: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  details: { flex: 1, minWidth: 0 },

  circle: {
    width: 54,
    height: 54,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompact: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  titleCompact: {
    fontSize: 15,
  },

  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    marginTop: 3,
  },
  clientText: {
    flex: 1,
    fontSize: 12,
  },
  valueLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeToggle } from '@context/ThemeContext';

type props = {
  title: string;
  cliente: string;
  valor: number;
  status: 'pendente' | 'aprovado';
  onPress?: () => void;
};

const Orcamento = ({ title, cliente, valor, status, onPress }: props) => {
  const { colors } = useTheme();
  const { compactLists } = useThemeToggle();
  const isDark = colors.background !== '#ffffff';

  const cardBg = isDark ? '#253140' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subText = isDark ? '#cbd5e1' : '#6b7280';

  const circleColor = isDark ? '#344254' : 'rgba(6, 32, 70, 0.22)';
  const arrowColor = isDark ? '#ffffff' : '#062046';
  const statusColor = isDark
    ? (status === 'aprovado' ? '#bbf7d0' : '#fde68a')
    : (status === 'aprovado' ? '#15803d' : '#b45309');
  const statusBg = isDark
    ? (status === 'aprovado' ? '#14532d' : '#78350f')
    : (status === 'aprovado' ? '#dcfce7' : '#fef3c7');

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View
        style={[
          styles.card,
          compactLists && styles.cardCompact,
          {
            backgroundColor: cardBg,
            shadowColor: isDark ? '#ffffff' : '#000000',
            shadowOpacity: isDark ? 0.08 : 0.8,
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
              size={compactLists ? 32 : 50}
              color={isDark ? '#ffffff' : '#062046'}
            />
          </View>

          <View style={styles.details}>
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

            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Ionicons name={status === 'aprovado' ? 'checkmark-circle' : 'time-outline'} size={14} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {status === 'aprovado' ? 'Aprovado' : 'Pendente'}
              </Text>
            </View>

            <Text
              numberOfLines={1}
              style={[
                styles.subtitle,
                compactLists && styles.subtitleCompact,
                { color: subText },
              ]}
            >
              Cliente: {cliente}
            </Text>

            {!compactLists && (
              <Text style={[styles.subtitle, { color: subText }]}>
              Valor: {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Text>
            )}
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
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowRadius: 8,
    elevation: 5,
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
    width: 65,
    height: 65,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompact: {
    width: 44,
    height: 44,
  },

  title: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  titleCompact: {
    fontSize: 15,
    marginBottom: 0,
  },

  subtitle: {
    fontSize: 16,
    marginTop: 2,
  },
  subtitleCompact: {
    fontSize: 13,
    marginTop: 0,
  },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginTop: 5 },
  statusText: { fontSize: 12, fontWeight: '800' },
});

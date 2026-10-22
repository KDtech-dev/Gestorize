import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { useMenu } from '@context/MenuContext';

type props = {
  title?: string;
  titulo?: string;
  subtitle?: string;
  onBackPress?: () => void;
  showFornecedorIcon?: boolean;
  showPessoaFisicaIcon?: boolean;
  showPessoaJuridicaIcon?: boolean;

  rightType?: 'menu' | 'add' | 'download' | 'share';
  onAddPress?: () => void;
  onDownloadPress?: () => void;
};

const Nav = ({
  title,
  titulo,
  subtitle,
  onBackPress,
  rightType = 'add',
  onAddPress,
  onDownloadPress,
}: props) => {
  const { colors } = useTheme();
  const { open } = useMenu();

  const isDarkTheme = colors.background !== '#ffffff';

  const backgroundColor = isDarkTheme ? '#ffffff' : '#062046';
  const isDarkBackground = backgroundColor !== '#ffffff';

  const textColor = isDarkBackground ? '#ffffff' : '#0f172a';
  const subtitleColor = isDarkBackground ? '#ffffffcc' : '#475569';
  const iconColor = isDarkBackground ? '#ffffff' : '#0f172a';
  const displayTitle = title ?? titulo;

  const handleRightPress = () => {
    if (rightType === 'menu') {
      open();
    } else if (rightType === 'add') {
      onAddPress?.();
    } else if (rightType === 'download' || rightType === 'share') {
      onDownloadPress?.();
    }
  };

  const renderRightIcon = () => {
    switch (rightType) {
      case 'menu':
        return (
          <Pressable
            onPress={handleRightPress}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: pressed
                  ? isDarkBackground
                    ? '#ffffff20'
                    : '#00000020'
                  : 'transparent',
              },
            ]}
          >
            <Ionicons name="menu" size={28} color={iconColor} />
          </Pressable>
        );
      case 'add':
        return (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: isDarkBackground ? '#ffffff' : '#062046',
              },
            ]}
            onPress={handleRightPress}
          >
            <Ionicons
              name="add"
              size={24}
              color={isDarkBackground ? '#0f172a' : '#ffffff'}
            />
          </TouchableOpacity>
        );
      case 'download':
      case 'share':
        return (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: isDarkBackground ? '#ffffff' : '#062046',
              },
            ]}
            onPress={handleRightPress}
          >
            <Ionicons
              name={rightType === 'share' ? 'share-outline' : 'download-outline'}
              size={24}
              color={isDarkBackground ? '#0f172a' : '#ffffff'}
            />
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.leftContainer} onPress={onBackPress}>
          <Ionicons name="chevron-back" size={26} color={iconColor} />

          <View style={styles.textWrapper}>
            <Text style={[styles.title, { color: textColor }]}>
              {displayTitle}
            </Text>

            {subtitle && (
              <Text style={[styles.subtitle, { color: subtitleColor }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {renderRightIcon()}
      </View>
    </View>
  );
};

export default Nav;

const styles = StyleSheet.create({
  container: {
    height: 140,
    paddingTop: 50,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    justifyContent: 'center',
    zIndex: 20,
    elevation: 20,
  },

  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  textWrapper: {
    justifyContent: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 15,
    marginTop: 2,
  },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});

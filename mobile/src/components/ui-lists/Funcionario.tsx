import { useState } from 'react';

import {
  Image,
  Modal,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTheme, useThemeToggle } from '@context/ThemeContext';

type Props = {
  nome: string | null;
  email: string | null;
  role: 'Gestor' | 'Funcionario' | 'Administrador';
  avatar?: string | null;
  onPress?: () => void;
};


const Funcionario = ({
  nome,
  email,
  role,
  avatar,
  onPress,
}: Props) => {
  const [avatarVisivel, setAvatarVisivel] = useState(false);

  const { colors } = useTheme();
  const { compactLists } = useThemeToggle();

  const isDark = colors.background !== '#ffffff';

  const cardBg = colors.card;
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subText = isDark ? '#cbd5e1' : '#6b7280';

  const circleColor = isDark
    ? colors.elevated
    : 'rgba(6, 32, 70, 0.12)';

  const arrowColor = isDark ? '#ffffff' : '#062046';

  const iconName =
    role === 'Gestor' ? 'person-circle-outline' : 'person-outline';

  const abrirAvatar = () => {
    if (avatar) {
      setAvatarVisivel(true);
    }
  };

  const fecharAvatar = () => {
    setAvatarVisivel(false);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
      >
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
            <TouchableOpacity
              activeOpacity={avatar ? 0.75 : 1}
              onPress={abrirAvatar}
              disabled={!avatar}
              accessibilityRole={
                avatar ? 'button' : undefined
              }
              accessibilityLabel={
                avatar
                  ? `Ampliar foto de ${nome}`
                  : undefined
              }
            >
              <View
                style={[
                  styles.circle,
                  compactLists && styles.circleCompact,
                  { backgroundColor: circleColor },
                ]}
              >
                {avatar ? (
                  <Image
                    source={{ uri: avatar }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name={iconName}
                    size={compactLists ? 30 : 46}
                    color={
                      isDark
                        ? '#ffffff'
                        : '#062046'
                    }
                  />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.info}>
              <View style={styles.roleLine}>
                <Ionicons name={iconName} size={12} color={colors.primary} />
                <Text
                  numberOfLines={1}
                  style={[styles.roleText, { color: colors.primary }]}
                >
                  {role}
                </Text>
              </View>

              <View style={styles.header}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.title,
                    compactLists &&
                    styles.titleCompact,
                    { color: textColor },
                  ]}
                >
                  {nome}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={14} color={subText} />
                <Text
                  numberOfLines={1}
                  style={[styles.detailText, { color: subText }]}
                >
                  {email || 'E-mail não informado'}
                </Text>
              </View>
            </View>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color={arrowColor}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={avatarVisivel}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={fecharAvatar}
      >
        <StatusBar
          backgroundColor="rgba(0,0,0,0.92)"
          barStyle="light-content"
        />

        <Pressable
          style={styles.modalOverlay}
          onPress={fecharAvatar}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={fecharAvatar}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Fechar imagem ampliada"
          >
            <Ionicons
              name="close"
              size={30}
              color="#ffffff"
            />
          </TouchableOpacity>

          {avatar && (
            <Pressable
              style={styles.imageContainer}
              onPress={(event) =>
                event.stopPropagation()
              }
            >
              <Image
                source={{ uri: avatar }}
                style={styles.expandedImage}
                resizeMode="contain"
              />

              <Text style={styles.avatarName}>
                {nome}
              </Text>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </>
  );
};

export default Funcionario;

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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  circle: {
    width: 64,
    height: 64,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  circleCompact: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  header: {
    minWidth: 0,
    marginBottom: 2,
  },

  roleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
    marginBottom: 3,
  },

  roleText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '800',
  },

  titleCompact: {
    fontSize: 15,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    marginTop: 3,
  },

  detailText: {
    flex: 1,
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  closeButton: {
    position: 'absolute',
    top: 45,
    right: 20,
    zIndex: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  expandedImage: {
    width: '100%',
    height: '75%',
    maxHeight: 550,
  },

  avatarName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
});

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
  tipo: 'PF' | 'PJ';
  nome: string;
  email: string | null;
  avatar?: string | null;
  estado?: string | null;
  selected?: boolean;
  onPress?: () => void;
};

const Cliente = ({
  tipo,
  nome,
  email,
  avatar,
  estado,
  selected = false,
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
    : 'rgba(6, 32, 70, 0.22)';

  const arrowColor = isDark ? '#ffffff' : '#062046';

  const badgeBg = isDark
    ? 'rgba(255,255,255,0.12)'
    : 'rgba(0,104,255,0.2)';

  const badgeText = isDark ? '#ffffff' : '#062046';

  const iconName =
    tipo === 'PF' ? 'person-outline' : 'business-outline';

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
              shadowOpacity: isDark ? 0.08 : 0.8,
              borderWidth: selected ? 3 : 0,
              borderColor: colors.accent,
            },
          ]}
        >
          <View style={styles.left}>
            <TouchableOpacity
              activeOpacity={avatar ? 0.75 : 1}
              onPress={abrirAvatar}
              disabled={!avatar}
              accessibilityRole={avatar ? 'button' : undefined}
              accessibilityLabel={
                avatar ? `Ampliar foto de ${nome}` : undefined
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
                    color={isDark ? '#ffffff' : '#062046'}
                  />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.info}>
              <View style={styles.header}>
                <Text
                  numberOfLines={2}
                  style={[
                    styles.title,
                    compactLists && styles.titleCompact,
                    { color: textColor },
                  ]}
                >
                  {nome}
                </Text>

                {!compactLists && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: badgeBg },
                    ]}
                  >
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.badgeText,
                        { color: badgeText },
                      ]}
                    >
                      {tipo === 'PF'
                        ? 'Pessoa física'
                        : 'Pessoa jurídica'}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.subtitle,
                  compactLists && styles.subtitleCompact,
                  { color: subText },
                ]}
              >
                {email || 'E-mail não informado'}
              </Text>

              {!compactLists && estado ? (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="location-outline"
                    size={15}
                    color={subText}
                  />

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.detailText,
                      { color: subText },
                    ]}
                  >
                    {estado}
                  </Text>
                </View>
              ) : null}

              {compactLists && (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.compactCategory,
                    { color: subText },
                  ]}
                >
                  {tipo === 'PF'
                    ? 'Pessoa física'
                    : 'Pessoa jurídica'}
                </Text>
              )}
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
              onPress={(event) => event.stopPropagation()}
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

export default Cliente;

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
    width: 65,
    height: 65,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  circleCompact: {
    width: 44,
    height: 44,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    minWidth: 0,
    marginBottom: 3,
  },

  title: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '900',
  },

  titleCompact: {
    fontSize: 15,
  },

  badge: {
    maxWidth: '100%',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
    flexWrap: 'wrap',
    width: '100%',
  },

  subtitle: {
    fontSize: 16,
    marginTop: 3,
  },

  subtitleCompact: {
    fontSize: 12,
    marginTop: 2,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    marginTop: 5,
  },

  detailText: {
    flex: 1,
    fontSize: 13,
  },

  compactCategory: {
    fontSize: 12,
    marginTop: 2,
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

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
  nome: string;
  preco?: number | null;
  estoque: number;
  unidade?: string | null;
  categoria?: string | null;
  imagem?: string | null;
  onPress?: () => void;
};

const Produto = ({
  nome,
  preco,
  estoque,
  unidade,
  categoria,
  imagem,
  onPress,
}: Props) => {
  const [imagemVisivel, setImagemVisivel] = useState(false);

  const { colors } = useTheme();
  const { compactLists } = useThemeToggle();

  const isDark = colors.background !== '#ffffff';

  const cardBg = isDark ? '#0A4191' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subText = isDark ? '#cbd5e1' : '#6b7280';

  const circleColor = isDark
    ? '#09377B'
    : 'rgba(6, 32, 70, 0.22)';

  const arrowColor = isDark ? '#ffffff' : '#062046';

  const badgeBg = isDark
    ? 'rgba(255,255,255,0.2)'
    : 'rgba(0,104,255,0.2)';

  const badgeText = isDark ? '#ffffff' : '#062046';

  const abrirImagem = () => {
    if (imagem) {
      setImagemVisivel(true);
    }
  };

  const fecharImagem = () => {
    setImagemVisivel(false);
  };

  const precoFormatado = (preco ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
            },
          ]}
        >
          <View style={styles.left}>
            <TouchableOpacity
              activeOpacity={imagem ? 0.75 : 1}
              onPress={abrirImagem}
              disabled={!imagem}
              accessibilityRole={imagem ? 'button' : undefined}
              accessibilityLabel={
                imagem ? `Ampliar imagem de ${nome}` : undefined
              }
            >
              <View
                style={[
                  styles.circle,
                  compactLists && styles.circleCompact,
                  { backgroundColor: circleColor },
                ]}
              >
                {imagem ? (
                  <Image
                    source={{ uri: imagem }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons
                    name="cube-outline"
                    size={compactLists ? 30 : 46}
                    color={isDark ? '#ffffff' : '#062046'}
                  />
                )}
              </View>
            </TouchableOpacity>

            {/* Informações do produto */}
            <View style={styles.info}>
              {/* Nome e categoria */}
              <View style={styles.header}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.title,
                    compactLists && styles.titleCompact,
                    { color: textColor },
                  ]}
                >
                  {nome}
                </Text>

                {!compactLists && categoria ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: badgeBg },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.badgeText,
                        { color: badgeText },
                      ]}
                    >
                      {categoria}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Preço */}
              <Text
                numberOfLines={1}
                style={[
                  styles.subtitle,
                  compactLists && styles.subtitleCompact,
                  { color: subText },
                ]}
              >
                Valor: R$ {precoFormatado}
              </Text>

              {/* Estoque */}
              {!compactLists && (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="cube-outline"
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
                    Estoque: {estoque} {unidade ?? ''}
                  </Text>
                </View>
              )}

              {/* Categoria no modo compacto */}
              {compactLists && categoria ? (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.compactCategory,
                    { color: subText },
                  ]}
                >
                  {categoria}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Indicador de navegação */}
          <Ionicons
            name="chevron-forward"
            size={22}
            color={arrowColor}
          />
        </View>
      </TouchableOpacity>

      {/* Modal para ampliar a imagem */}
      <Modal
        visible={imagemVisivel}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={fecharImagem}
      >
        <StatusBar
          backgroundColor="rgba(0,0,0,0.92)"
          barStyle="light-content"
        />

        <Pressable
          style={styles.modalOverlay}
          onPress={fecharImagem}
        >
          {/* Botão de fechar */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={fecharImagem}
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

          {/* Imagem ampliada e nome do produto */}
          {imagem && (
            <Pressable
              style={styles.imageContainer}
              onPress={(event) => event.stopPropagation()}
            >
              <Image
                source={{ uri: imagem }}
                style={styles.expandedImage}
                resizeMode="contain"
              />

              <Text style={styles.productName}>
                {nome}
              </Text>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </>
  );
};

export default Produto;

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    maxWidth: 120,
    flexShrink: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  subtitle: {
    fontSize: 16,
    marginTop: 3,
  },

  subtitleCompact: {
    fontSize: 13,
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
    height: 450,
    maxHeight: '75%',
  },

  productName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
});
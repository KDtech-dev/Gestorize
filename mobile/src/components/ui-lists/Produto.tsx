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
  validade?: string | null;
  imagem?: string | null;
  selected?: boolean;
  onPress?: () => void;
};

const Produto = ({
  nome,
  preco,
  estoque,
  unidade,
  categoria,
  validade,
  imagem,
  selected = false,
  onPress,
}: Props) => {
  const [imagemVisivel, setImagemVisivel] = useState(false);

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
  const dataValidade = validade?.slice(0, 10) ?? null;
  const hojeDate = new Date();
  const hoje = `${hojeDate.getFullYear()}-${String(hojeDate.getMonth() + 1).padStart(2, '0')}-${String(hojeDate.getDate()).padStart(2, '0')}`;
  const validadeVencida = Boolean(dataValidade && dataValidade < hoje);
  const validadeFormatada = dataValidade
    ? `${dataValidade.slice(8, 10)}/${dataValidade.slice(5, 7)}/${dataValidade.slice(0, 4)}`
    : null;
  const validadeStatus = dataValidade === hoje ? 'Vence hoje' : validadeVencida ? 'Vencido' : 'No prazo';

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
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? colors.primary : colors.border,
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

            <View style={styles.info}>
              {categoria ? (
                <View style={styles.categoryLine}>
                  <Ionicons name="pricetag-outline" size={12} color={colors.primary} />
                  <Text
                    numberOfLines={1}
                    style={[styles.categoryText, { color: colors.primary }]}
                  >
                    {categoria}
                  </Text>
                </View>
              ) : null}

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
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.subtitle,
                  compactLists && styles.subtitleCompact,
                  { color: colors.primary },
                ]}
              >
                Valor: R$ {precoFormatado}
              </Text>

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

              {validadeFormatada ? (
                <View style={styles.detailRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={15}
                    color={validadeVencida ? colors.error : colors.success}
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.detailText, { color: validadeVencida ? colors.error : subText }]}
                  >
                    Validade: {validadeFormatada} · {validadeStatus}
                  </Text>
                </View>
              ) : null}
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

  categoryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
    marginBottom: 3,
  },

  categoryText: {
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

  subtitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 7,
  },

  subtitleCompact: {
    fontSize: 14,
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

import React from 'react';
import { Card } from '@components/ui/card';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';

interface NavButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description?: string;
  onClick?: () => void;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

export function NavButton({
  icon,
  label,
  description,
  onClick,
  disabled,
  containerStyle,
}: NavButtonProps) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const { colors, isDark } = useTheme();

  const cardBg = colors.card;

  const iconColor = disabled ? colors.muted : colors.primary;

  const iconBg = disabled ? colors.border : colors.elevated;

  const textColor = disabled ? colors.muted : isDark ? '#ffffff' : colors.text;

  const subtitleColor = colors.muted;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View
      style={[styles.shadowWrapper, containerStyle, { transform: [{ scale }] }]}
    >
      <Card
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: isDark ? colors.border : '#CBD5E1',
            shadowColor: '#000000',
            shadowOpacity: isDark ? 0.12 : 0.09,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Pressable
          style={styles.inner}
          accessibilityRole="button"
          accessibilityState={{ disabled: !!disabled }}
          accessibilityLabel={`${label}${description ? `. ${description}` : ''}. Abrir`}
          onPress={disabled ? undefined : onClick}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
        >
          <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
            <MaterialCommunityIcons name={icon} size={45} color={iconColor} />
          </View>

          <Text style={[styles.title, { color: textColor }]}>{label}</Text>

          {description ? (
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              {description}
            </Text>
          ) : null}
          <View style={styles.actionHint}>
            <Text style={[styles.actionText, { color: disabled ? colors.muted : colors.primary }]}>Abrir</Text>
            <MaterialCommunityIcons name="arrow-right" size={15} color={disabled ? colors.muted : colors.primary} />
          </View>
        </Pressable>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    width: '100%',
  },
  card: {
    minHeight: 178,
    width: '100%',
    borderWidth: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  inner: {
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: { flex: 1 },
  title: { marginTop: 2, fontWeight: '800', fontSize: 15, textAlign: 'center' },
  subtitle: { marginTop: 1, fontSize: 12, lineHeight: 16, textAlign: 'center' },
  actionHint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  actionText: { fontSize: 11, fontWeight: '700' },
});

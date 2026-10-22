import React, { useRef } from 'react';
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

  const iconColor = disabled ? colors.muted : isDark ? colors.accent : '#ffffff';

  const iconBg = disabled ? colors.border : isDark ? colors.elevated : colors.primary;

  const borderColor = disabled
    ? colors.border
    : isDark
      ? colors.accent
      : colors.primary;

  const textColor = disabled ? colors.muted : isDark ? '#ffffff' : colors.text;

  const subtitleColor = disabled
    ? colors.muted
    : isDark
      ? '#C3CBD6'
      : colors.muted;

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
        onClick={disabled ? undefined : onClick}
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderLeftColor: borderColor,
            shadowColor: isDark ? '#ffffff' : '#000000',
            shadowOpacity: isDark ? 0.07 : 0.1,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Pressable
          style={styles.inner}
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
    minHeight: 190,
    width: '100%',
    borderLeftWidth: 4,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  inner: {
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: { flex: 1 },
  title: { marginTop: 4, fontWeight: '800', fontSize: 16, textAlign: 'center' },
  subtitle: { marginTop: 2, fontSize: 13, lineHeight: 17, textAlign: 'center' },
});

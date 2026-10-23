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

  const iconColor = disabled ? colors.muted : colors.primary;

  const iconBg = disabled ? colors.border : colors.elevated;

  const borderColor = colors.primary;

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
        onClick={disabled ? undefined : onClick}
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: colors.border,
            borderLeftColor: borderColor,
            shadowColor: '#000000',
            shadowOpacity: isDark ? 0.04 : 0.06,
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
    minHeight: 166,
    width: '100%',
    borderLeftWidth: 4,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  inner: {
    alignItems: 'center',
    gap: 8,
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
});

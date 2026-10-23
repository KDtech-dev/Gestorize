import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

const TooltipChip = ({ label, active = false, onPress }: Props) => {
  const { colors } = useTheme();

  const backgroundColor = active
    ? colors.accent
    : colors.surface;

  const textColor = active
    ? colors.accentText
    : colors.text;

  const borderColor = active
    ? colors.accent
    : colors.background === '#ffffff' ? '#D8DEE8' : '#465568';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.container, { backgroundColor, borderColor, borderWidth: 1 }]}
    >
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
};

export default TooltipChip;

const styles = StyleSheet.create({
  container: {
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
    flexShrink: 0,
    maxWidth: 280,
  },

  text: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    maxWidth: 248,
  },
});

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
  const isDark = colors.background !== '#ffffff';

  const backgroundColor = active
    ? isDark
      ? '#ffffff'
      : '#000000'
    : isDark
      ? '#ffffff15'
      : '#00000010';

  const textColor = active
    ? isDark
      ? '#000'
      : '#fff'
    : isDark
      ? '#fff'
      : '#000';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { backgroundColor }]}
    >
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
};

export default TooltipChip;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexShrink: 0,
    maxWidth: 280,
  },

  text: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    maxWidth: 248,
  },
});

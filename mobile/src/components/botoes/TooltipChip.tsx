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
    ? isDark ? colors.accent : '#000000'
    : isDark ? colors.card : '#00000010';

  const textColor = active
    ? isDark ? colors.accentText : '#fff'
    : isDark ? '#E2E8F0' : '#000';

  const borderColor = isDark
    ? active ? colors.accent : '#526173'
    : active ? '#000000' : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { backgroundColor, borderColor, borderWidth: isDark ? 1 : 0 }]}
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

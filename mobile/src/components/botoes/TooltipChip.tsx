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
    : colors.background === '#ffffff' ? '#CBD5E1' : '#526173';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { backgroundColor, borderColor, borderWidth: 1 }]}
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

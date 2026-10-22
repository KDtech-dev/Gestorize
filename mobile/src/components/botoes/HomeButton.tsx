import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
  View,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';

type HomeButtonProps = {
  title?: string;
  icon?: React.ReactNode;
  variant?: 'contained' | 'outlined';
  color?: 'primary' | 'secondary';
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  type?: 'dialog' | 'submit';
};

const HomeButton = ({
  title = 'Button',
  icon,
  variant = 'contained',
  color = 'primary',
  onPress,
  disabled = false,
  type = 'submit',
}: HomeButtonProps) => {
  const { colors, isDark } = useTheme();
  const buttonColor = color === 'primary'
    ? (isDark ? colors.card : '#2d5a91')
    : (isDark ? '#B28D3B' : '#F2B705');
  const buttonTextColor = color === 'primary' || isDark ? '#FFFFFF' : '#062046';
  const backgroundColor =
    variant === 'contained'
      ? buttonColor
      : 'transparent';

  const borderColor =
    variant === 'outlined'
      ? buttonColor
      : 'transparent';

  const textColor =
    variant === 'contained' ? buttonTextColor : (isDark ? '#FFFFFF' : '#0B3A75');

  const containerStyle = [
    styles.base,
    type === 'dialog' && styles.dialogButton,
    {
      backgroundColor: disabled ? '#ccc' : backgroundColor,
      borderColor: disabled ? '#AAB4C3' : borderColor,
      borderWidth: variant === 'outlined' ? 2 : 0,
      borderLeftWidth: isDark ? 4 : (variant === 'outlined' ? 2 : 0),
      borderLeftColor: isDark ? colors.accent : borderColor,
    },
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={containerStyle}
      disabled={disabled}
    >
      <View style={styles.content}>
        {icon && <View style={[styles.icon, { backgroundColor: variant === 'contained' ? 'rgba(255,255,255,0.16)' : `${buttonColor}1A` }]}>{icon}</View>}
        <View style={styles.textWrapper}>
          <Text style={[styles.text, { color: disabled ? '#64748B' : textColor }]}>
            {title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    width: '95%',
    maxWidth: '90%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  dialogButton: {
    width: '100%',
    maxWidth: '110%',
    height: 64,
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    minHeight: 42,
    position: 'relative',
  },
  icon: {
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});

export default HomeButton;

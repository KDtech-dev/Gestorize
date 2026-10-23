import React from 'react';
import { View, StyleSheet, Pressable, StatusBar, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LogoIcon from '@components/LogoIcon';
import { useTheme } from '@context/ThemeContext';
import { useMenu } from '@context/MenuContext';
import { useAuth } from '@context/AuthContext';

const HomeHeader = () => {
  const { colors } = useTheme();
  const { open, close, isOpen } = useMenu();
  const { user, signOut } = useAuth();
  const isGlobalAdmin = user?.role === 'admin' && !user.organization_id;
  const isDark = colors.background !== '#ffffff';
  const headerBackground = isDark ? '#ffffff' : '#062046';
  const isDarkBackground = headerBackground !== '#ffffff';
  const iconColor = isDarkBackground ? '#fff' : '#000';

  const handleMenu = () => {
    if (isGlobalAdmin) {
      void signOut();
      return;
    }
    if (isOpen) {
      close();
    } else {
      open();
    }
  };
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: headerBackground,
          paddingTop: (StatusBar.currentHeight ?? 25) + 6,
        },
      ]}
    >
      <LogoIcon
        variant="header"
        background={isDarkBackground ? 'dark' : 'light'}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isGlobalAdmin ? 'Sair da conta' : isOpen ? 'Fechar menu' : 'Abrir menu'}
        onPress={handleMenu}
        style={({ pressed }) => [
          styles.iconButton,
          isGlobalAdmin && styles.adminExit,
          {
            backgroundColor: pressed
              ? isDarkBackground
                ? '#ffffff'
                : '#00000020'
              : 'transparent',
          },
        ]}
      >
        <>
          <MaterialCommunityIcons
            name={isGlobalAdmin ? 'logout' : isOpen ? 'close' : 'menu'}
            size={28}
            color={iconColor}
          />
          {isGlobalAdmin ? <Text style={[styles.exitLabel, { color: iconColor }]}>Sair</Text> : null}
        </>
      </Pressable>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  container: {
    height: 140,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminExit: { width: 'auto', paddingHorizontal: 10, flexDirection: 'row', gap: 6 },
  exitLabel: { fontSize: 14, fontWeight: '800' },
});

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@context/types';
import { useAuth } from '@context/AuthContext';
import LoginCard from '@components/cards/login-card';
import { useTheme, useThemeToggle } from '@context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const Login = ({ navigation }: Props) => {
  const { colors, isDark } = useTheme();
  const { toggle } = useThemeToggle();

  const translateYCard = useRef(new Animated.Value(0)).current;
  const translateYLogo = useRef(new Animated.Value(0)).current;
  const scaleLogo = useRef(new Animated.Value(1)).current;

  const headerBackground = isDark ? '#ffffff' : '#0D2B52';
  const textColor = isDark ? '#0f172a' : '#ffffff';
  const subtitleColor = isDark ? '#475569' : '#ffffffcc';

  const cardBackground = colors.surface;

  const logoSource = isDark
    ? require('@assets/images/Logo.png')
    : require('@assets/images/LogoLight.png');

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => { });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      Animated.parallel([
        Animated.timing(translateYCard, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYLogo, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleLogo, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const handleLoginAnimation = () => {
    Animated.parallel([
      Animated.timing(translateYCard, {
        toValue: -200,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateYLogo, {
        toValue: -50,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleLogo, {
        toValue: 0.7,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: headerBackground }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={-70}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
          onPress={toggle}
          style={[styles.themeButton, { backgroundColor: isDark ? '#0f172a0D' : '#ffffff18', borderColor: isDark ? '#0f172a33' : '#ffffff55' }]}
        >
          <MaterialCommunityIcons name={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'} size={19} color={textColor} />
          <Text style={[styles.themeButtonText, { color: textColor }]}>{isDark ? 'Claro' : 'Escuro'}</Text>
        </Pressable>
        <View style={styles.header}>
          <Animated.Image
            source={logoSource}
            style={[
              styles.logo, { transform: [{ translateY: translateYLogo }, { scale: scaleLogo },], },
            ]}
          />

          <Text style={[styles.title, { color: textColor }]}>Gestorize</Text>

          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            O seu sistema de gestão empresarial
          </Text>
        </View>

        <Animated.View
          style={[
            styles.cardContainer,
            {
              backgroundColor: cardBackground,
              transform: [{ translateY: translateYCard }],
            },
          ]}
        >
          <LoginCard onLoginSuccess={handleLoginAnimation} />
        </Animated.View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D2B52',
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  logo: {
    width: 200,
    height: 170,
    marginBottom: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.8,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    marginTop: -40,
  },
  themeButton: {
    position: 'absolute',
    zIndex: 2,
    top: 52,
    right: 20,
    minHeight: 38,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  themeButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

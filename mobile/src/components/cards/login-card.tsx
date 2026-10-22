import Button from '@components/botoes/Button';
import InputLogin from '@components/inputs/input-login';
import { useAuth } from '@context/AuthContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';

type props = {
  onLoginSuccess: () => void;
};

export default function LoginCard({ onLoginSuccess }: props) {
  const [email, setEmail] = useState('teste@email.com');
  const [senha, setSenha] = useState('123456');
  const [remember, setRemember] = useState(false);
  const { signIn, loading } = useAuth();
  const [erro, setErro] = useState<string | null>(null);

  const { colors, isDark } = useTheme();

  const titleColor = isDark ? '#ffffff' : '#000';
  const subtitleColor = isDark ? '#cdd9f1' : '#444';
  const labelColor = isDark ? '#ffffff' : '#000';

  const handleLogin = async () => {
    try {
      await signIn(email, senha, remember);
      setErro(null);
      onLoginSuccess();
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? 'Erro ao fazer login');
    }
  };
  return (
    <View style={styles.card}>
      <Text style={[styles.title, { color: titleColor }]}>
        Bem-Vindo de volta
      </Text>
      <Text style={[styles.subtitle, { color: subtitleColor }]}>
        Entre com suas credenciais para acessar
      </Text>
      <Text style={[styles.label, { color: labelColor }]}>Email</Text>
      <InputLogin
        placeholder="seu@email.com"
        value={email}
        onChangeText={setEmail}
        icon="mail-outline"
      />
      <Text style={[styles.label, { color: labelColor }]}>Senha</Text>
      <InputLogin
        placeholder="Digite sua senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        icon="lock-closed-outline"
      />
      {erro ? <Text style={styles.error}>{erro}</Text> : null}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: remember }}
        onPress={() => setRemember((current) => !current)}
        style={styles.rememberRow}
      >
        <Ionicons
          name={remember ? 'checkbox' : 'square-outline'}
          size={22}
          color={remember ? colors.primary : colors.muted}
        />
        <Text style={[styles.rememberText, { color: colors.text }]}>Lembre de mim</Text>
      </Pressable>
      <TouchableOpacity>
        <Text style={styles.forgot}>Esqueceu a senha?</Text>
      </TouchableOpacity>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        <Button title="Entrar" onPress={() => handleLogin()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    width: '100%',
    alignSelf: 'center',
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },

  subtitle: {
    fontSize: 17,
    color: '#444',
    marginTop: 6,
    marginBottom: 20,
  },

  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
    color: '#000',
  },

  forgot: {
    color: '#1E5ED6',
    textAlign: 'right',
    marginTop: 10,
    marginBottom: 25,
    fontWeight: '500',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 9,
    minHeight: 44,
    marginTop: 8,
  },
  rememberText: {
    fontSize: 15,
    fontWeight: '500',
  },
  error: {
    color: '#C62828',
    fontSize: 13,
    marginTop: 8,
  },
});

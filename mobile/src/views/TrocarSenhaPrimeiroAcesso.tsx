import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Nav from '@components/utilities/Nav';
import EditableTextCard from '@components/EditableTextCard';
import Button from '@components/botoes/Button';
import { InputError } from '@components/InputError';
import { FormAccessProvider } from '@context/FormAccessContext';
import { RootStackParamList } from '@context/types';
import { useAuth } from '@context/AuthContext';
import { useTheme } from '@context/ThemeContext';
import { trocarSenhaPrimeiroAcesso } from '@api/apiAuth';
import { formatErrorMessage } from '@core/utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'TrocarSenhaPrimeiroAcesso'>;
const schema = z.object({
  current_password: z.string().min(1, 'Informe a senha inicial recebida.'),
  password: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres.'),
  password_confirmation: z.string().min(1, 'Confirme a nova senha.'),
}).superRefine((data, context) => {
  if (data.password !== data.password_confirmation) context.addIssue({ code: 'custom', path: ['password_confirmation'], message: 'As senhas não coincidem.' });
  if (data.current_password === data.password) context.addIssue({ code: 'custom', path: ['password'], message: 'Escolha uma senha diferente da senha inicial.' });
});
type FormData = z.infer<typeof schema>;

export default function TrocarSenhaPrimeiroAcesso({ navigation }: Props) {
  const { colors } = useTheme();
  const { updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const { control, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: { current_password: '', password: '', password_confirmation: '' } });

  const submit = async (form: FormData) => {
    setSaving(true);
    try {
      const response = await trocarSenhaPrimeiroAcesso(form);
      await updateUser(response?.data ?? response);
      Toast.show({ type: 'success', text1: 'Senha atualizada', text2: 'Agora você já pode acessar a organização.' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Não foi possível trocar a senha', text2: formatErrorMessage(error, 'Confira os dados e tente novamente.') });
    } finally { setSaving(false); }
  };

  const field = (name: keyof FormData, label: string, placeholder: string) => <Controller
    key={name} control={control} name={name}
    render={({ field: { value, onChange }, fieldState: { error } }) => <View style={styles.field}><EditableTextCard label={label} placeholder={placeholder} tipo="password" value={value} onChangeText={onChange} /><InputError message={error?.message} /></View>}
  />;

  return <FormAccessProvider canEdit>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Nav title="Proteja sua conta" subtitle="Troca de senha obrigatória" rightType="menu" />
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}><Text style={{ color: colors.primary, fontSize: 26 }}>🔒</Text></View>
          <Text style={[styles.title, { color: colors.text }]}>Crie sua senha pessoal</Text>
          <Text style={[styles.description, { color: colors.muted }]}>Por segurança, a senha inicial do gestor só permite este primeiro acesso. Confirme-a e escolha uma nova senha para continuar.</Text>
          {field('current_password', 'Senha inicial *', 'Digite a senha recebida')}
          {field('password', 'Nova senha *', 'Pelo menos 8 caracteres')}
          {field('password_confirmation', 'Confirme a nova senha *', 'Digite a nova senha novamente')}
          <Button title={saving ? 'Atualizando...' : 'Salvar nova senha'} onPress={handleSubmit(submit)} disabled={saving} />
          {saving ? <ActivityIndicator color={colors.primary} /> : null}
        </View>
      </View>
    </View>
  </FormAccessProvider>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { flex: 1, padding: 18, justifyContent: 'center' }, card: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 14 }, icon: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 21, fontWeight: '900' }, description: { fontSize: 14, lineHeight: 21 }, field: { gap: 2 } });

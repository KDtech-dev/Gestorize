import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Nav from '@components/utilities/Nav';
import Avatar from '@components/Avatar';
import EditableTextCard from '@components/EditableTextCard';
import DateField from '@components/DateField';
import Button from '@components/botoes/Button';
import { InputError } from '@components/InputError';
import { getCurrentUser, updateCurrentUser } from '@api/apiAuth';
import { useAuth } from '@context/AuthContext';
import { EnderecoType, RootStackParamList, UserType } from '@context/types';
import { useTheme } from '@context/ThemeContext';
import { dateFromApi, dateToApi, formatCep, formatCpf, formatDate, formatTelefone, onlyNumbers, formatErrorMessage } from '@core/utils/format';
import Toast from 'react-native-toast-message';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const schema = z.object({
  name: z.string().min(2, 'Informe seu nome.').max(255),
  email: z.string().email('Informe um e-mail válido.'),
  telefone: z.string(), cpf: z.string(), data_nascimento: z.string(),
  password: z.string().optional(), password_confirmation: z.string().optional(),
  cep: z.string(), logradouro: z.string(), numero: z.string(), complemento: z.string(),
  bairro: z.string(), cidade: z.string(), estado: z.string(),
}).superRefine((values, context) => {
  if (values.password && values.password.length < 8) context.addIssue({ code: 'custom', path: ['password'], message: 'A nova senha deve ter ao menos 8 caracteres.' });
  if (values.password && values.password !== values.password_confirmation) context.addIssue({ code: 'custom', path: ['password_confirmation'], message: 'As senhas não conferem.' });
});
type FormData = z.input<typeof schema>;

const perfis: Record<string, string> = { admin: 'Administrador', gestor: 'Gestor', funcionario: 'Funcionário', cliente: 'Cliente' };
const nomePerfil = (role?: string | null) => perfis[role?.toLowerCase() ?? ''] ?? 'Usuário';
const vazio = (endereco?: EnderecoType | null, chave?: keyof EnderecoType) => endereco?.[chave!] == null ? '' : String(endereco[chave!]);

export default function UserPerfil() {
  const navigation = useNavigation<Navigation>();
  const { user, updateUser } = useAuth();
  const { colors } = useTheme();
  const [perfil, setPerfil] = useState<UserType | null>(user ?? null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema), mode: 'onChange',
    defaultValues: { name: '', email: '', telefone: '', cpf: '', data_nascimento: '', password: '', password_confirmation: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' },
  });
  const unsavedGuard = useUnsavedChangesGuard({ hasUnsavedChanges: isDirty, message: 'As alterações do perfil não foram salvas. Deseja sair e descartar as alterações?' });

  const preencher = (data: UserType) => {
    const address = data.funcionario?.endereco;
    setPerfil(data);
    reset({
      name: data.nome ?? data.name ?? '', email: data.email ?? '',
      telefone: onlyNumbers(data.funcionario?.telefone ?? '', 11), cpf: onlyNumbers(data.funcionario?.cpf ?? '', 11),
      data_nascimento: dateFromApi(data.funcionario?.data_nascimento?.slice(0, 10)) ?? '',
      password: '', password_confirmation: '', cep: vazio(address, 'cep'), logradouro: vazio(address, 'logradouro'),
      numero: vazio(address, 'numero'), complemento: vazio(address, 'complemento'), bairro: vazio(address, 'bairro'),
      cidade: vazio(address, 'cidade'), estado: vazio(address, 'estado'),
    });
  };

  useEffect(() => {
    let ativo = true;
    getCurrentUser().then(({ data }) => { if (ativo) preencher(data); })
      .catch((error: any) => Toast.show({ type: 'error', text1: 'Não foi possível carregar o perfil', text2: formatErrorMessage(error, 'Exibindo os dados disponíveis.') }))
      .finally(() => { if (ativo) setLoading(false); });
    return () => { ativo = false; };
  }, []);

  const salvar = handleSubmit(async (values) => {
    try {
      setSaving(true);
      const payload: Record<string, any> = {
        name: values.name.trim(), email: values.email.trim(),
        funcionario: { telefone: onlyNumbers(values.telefone, 11) || null, data_nascimento: values.data_nascimento ? dateToApi(values.data_nascimento) : null },
        endereco: { cep: onlyNumbers(values.cep, 8), logradouro: values.logradouro.trim(), numero: values.numero.trim(), complemento: values.complemento.trim() || null, bairro: values.bairro.trim(), cidade: values.cidade.trim(), estado: values.estado.trim().toUpperCase() },
      };
      const cpf = onlyNumbers(values.cpf, 11);
      if (cpf) payload.funcionario.cpf = cpf;
      if (values.password) payload.password = values.password;
      const { data } = await updateCurrentUser(payload);
      preencher(data);
      await updateUser(data);
      Toast.show({ type: 'success', text1: 'Perfil atualizado', text2: 'Seus dados foram salvos.' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erro ao atualizar perfil', text2: formatErrorMessage(error, 'Confira os campos e tente novamente.') });
    } finally { setSaving(false); }
  });

  const campo = (name: keyof FormData, label: string, placeholder = 'Não informado', tipo: 'string' | 'number' | 'password' = 'string', format?: (value: string) => string, displayFormat?: (value: string) => string) => (
    <Controller key={name} control={control} name={name} render={({ field: { value, onChange }, fieldState: { error } }) => <>
      <EditableTextCard label={label} value={displayFormat ? displayFormat(String(value ?? '')) : String(value ?? '')} placeholder={placeholder} tipo={tipo} onChangeText={(text) => onChange(format ? format(text) : text)} />
      <InputError message={error?.message} />
    </>} />
  );

  const roleLabel = useMemo(() => nomePerfil(perfil?.role ?? user?.role), [perfil?.role, user?.role]);
  return <View style={[styles.screen, { backgroundColor: colors.background }]}>
    <Nav title="Meu perfil" subtitle={roleLabel} onBackPress={() => navigation.goBack()} rightType="menu" />
    {unsavedGuard.dialog}
    {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ color: colors.muted, marginTop: 10 }}>Carregando seus dados...</Text></View> :
      <KeyboardAwareScrollView contentContainerStyle={styles.content} enableOnAndroid showsVerticalScrollIndicator={false}>
        <View style={styles.identity}><Avatar nome={perfil?.nome ?? perfil?.name ?? 'Usuário'} imageUri={perfil?.avatar_url ?? null} size={112} editable={false} /><Text style={[styles.name, { color: colors.text }]}>{perfil?.nome ?? perfil?.name ?? 'Usuário'}</Text><Text style={{ color: colors.muted }}>{perfil?.email ?? ''}</Text></View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados da conta</Text>
        {campo('name', 'Nome completo', 'Informe seu nome')}{campo('email', 'E-mail', 'Informe seu e-mail')}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados pessoais</Text>
        {campo('telefone', 'Telefone', '(00) 00000-0000', 'number', (v) => onlyNumbers(v, 11), formatTelefone)}{campo('cpf', 'CPF', '000.000.000-00', 'number', (v) => onlyNumbers(v, 11), formatCpf)}
        <Controller control={control} name="data_nascimento" render={({ field: { value, onChange }, fieldState: { error } }) => <><DateField label="Data de nascimento" value={value ?? ''} onChange={(text) => onChange(formatDate(text))} /><InputError message={error?.message} /></>} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Endereço</Text>
        {campo('cep', 'CEP', '00000-000', 'number', (v) => onlyNumbers(v, 8), formatCep)}{campo('logradouro', 'Logradouro')}{campo('numero', 'Número')}{campo('complemento', 'Complemento')}{campo('bairro', 'Bairro')}{campo('cidade', 'Cidade')}{campo('estado', 'Estado (UF)', 'UF', 'string', (v) => v.toUpperCase(), (v) => v.toUpperCase())}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Alterar senha</Text>
        <Text style={[styles.helper, { color: colors.muted }]}>A senha atual é protegida e não pode ser exibida. Deixe os campos abaixo vazios para mantê-la.</Text>
        {campo('password', 'Nova senha', 'Deixe em branco para manter', 'password')}{campo('password_confirmation', 'Confirme a nova senha', 'Repita a nova senha', 'password')}
        <Button title={saving ? 'Salvando...' : 'Salvar alterações'} onPress={salvar} disabled={!isDirty || saving} />
      </KeyboardAwareScrollView>}
  </View>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 18, paddingBottom: 36 }, identity: { alignItems: 'center', paddingVertical: 14, marginBottom: 8 }, name: { fontSize: 20, fontWeight: '900', marginTop: 10 }, sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 15 }, helper: { fontSize: 13, marginTop: 5 } });

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import Nav from '@components/utilities/Nav';
import EditableTextCard from '@components/EditableTextCard';
import Button from '@components/botoes/Button';
import Selector from '@components/Selector';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputError } from '@components/InputError';
import { FormAccessProvider } from '@context/FormAccessContext';
import { RootStackParamList } from '@context/types';
import { useTheme } from '@context/ThemeContext';
import { createOrganizacao, getOrganizacoes, updateOrganizacao } from '@api/apiOrganizacoes';
import { organizacaoSchema } from '@schemas/OrganizacaoSchema';

type Props = NativeStackScreenProps<RootStackParamList, 'OrganizacaoForm'>;
type FormData = { name: string; document: string; email: string; phone: string; managerName: string; managerEmail: string; managerPassword: string; managerCpf: string; managerId: string };
const initialValues: FormData = { name: '', document: '', email: '', phone: '', managerName: '', managerEmail: '', managerPassword: '', managerCpf: '', managerId: '' };

export default function FormularioOrganizacao({ navigation, route }: Props) {
  const { colors } = useTheme();
  const isEdit = route.params.modo === 'editar';
  const organizationId = route.params.organizationId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [managers, setManagers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const validationSchema = useMemo(() => organizacaoSchema(isEdit), [isEdit]);
  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<FormData>({ resolver: zodResolver(validationSchema) as Resolver<FormData>, mode: 'onChange', defaultValues: initialValues });

  const load = useCallback(async () => {
    if (!isEdit) return;
    if (!organizationId) { Toast.show({ type: 'error', text1: 'Organização não informada.' }); navigation.goBack(); return; }
    try {
      setLoading(true);
      const organizations = await getOrganizacoes();
      const organization = organizations.find((item) => String(item.id) === String(organizationId));
      if (!organization) throw new Error('Organização não encontrada.');
      setManagers(organization.managers ?? []);
      reset({ ...initialValues, name: organization.name, document: organization.document ?? '', email: organization.email ?? '', phone: organization.phone ?? '', managerId: organization.manager_id ?? '' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Não foi possível carregar a organização.', text2: error?.message });
      navigation.goBack();
    } finally { setLoading(false); }
  }, [isEdit, navigation, organizationId, reset]);
  useEffect(() => { void load(); }, [load]);

  const submit = async (form: FormData) => {
    setSaving(true);
    try {
      const organizationData = { name: form.name.trim(), document: form.document.trim() || null, email: form.email.trim() || null, phone: form.phone.trim() || null };
      if (isEdit && organizationId) await updateOrganizacao(organizationId, { ...organizationData, manager_id: form.managerId || null });
      else await createOrganizacao({ ...organizationData, manager: { name: form.managerName.trim(), email: form.managerEmail.trim(), password: form.managerPassword, cpf: form.managerCpf.replace(/\D/g, '') } });
      Toast.show({ type: 'success', text1: isEdit ? 'Organização atualizada.' : 'Organização criada.', text2: isEdit ? undefined : 'O gestor já pode acessar a organização.' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Não foi possível salvar a organização.', text2: error?.response?.data?.message ?? 'Confira os dados e tente novamente.' });
    } finally { setSaving(false); }
  };

  const input = (name: Exclude<keyof FormData, 'managerId'>, label: string, placeholder: string, tipo: 'string' | 'number' | 'password' = 'string') => <Controller
    key={name} control={control} name={name}
    render={({ field: { value, onChange }, fieldState: { error } }) => <View style={styles.field}><EditableTextCard label={label} placeholder={placeholder} value={value} onChangeText={onChange} tipo={tipo} /><InputError message={error?.message} /></View>}
  />;

  if (loading) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.text, marginTop: 12 }}>Carregando organização...</Text></View>;

  return <FormAccessProvider canEdit>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Nav title={isEdit ? 'Editar organização' : 'Nova organização'} subtitle="Dados da organização" onBackPress={() => navigation.goBack()} rightType="menu" />
      <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={40}>
        <View style={[styles.introCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${colors.primary}18` }]}><MaterialCommunityIcons name="domain" size={26} color={colors.primary} /></View>
          <View style={styles.heroText}><Text style={[styles.heroTitle, { color: colors.text }]}>{isEdit ? 'Dados da organização' : 'Configure uma organização'}</Text><Text style={[styles.help, { color: colors.muted }]}>Funcionários, cadastros e parâmetros ficam isolados nesta empresa.</Text></View>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeading}><MaterialCommunityIcons name="card-account-details-outline" size={20} color={colors.primary} /><Text style={[styles.sectionTitle, { color: colors.text }]}>Identificação e contato</Text></View>
          {input('name', 'Nome da organização *', 'Ex.: Loja Centro')}
          {input('document', 'CNPJ', '00.000.000/0000-00', 'number')}
          {input('email', 'E-mail da organização', 'contato@empresa.com')}
          {input('phone', 'Telefone', '(00) 00000-0000', 'number')}
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeading}><MaterialCommunityIcons name="account-tie-outline" size={20} color={colors.primary} /><Text style={[styles.sectionTitle, { color: colors.text }]}>{isEdit ? 'Gestor responsável' : 'Acesso do gestor'}</Text></View>
          <Text style={[styles.help, { color: colors.muted }]}>{isEdit ? 'Selecione um gestor já cadastrado nesta organização.' : 'O gestor inicial terá acesso apenas aos dados desta organização.'}</Text>
          {isEdit ? <Controller control={control} name="managerId" render={({ field: { value, onChange } }) => <Selector label="Gestor da organização" placeholder="Selecione um gestor" value={value} onChange={onChange} options={managers.map((manager) => ({ id: manager.id, nome: `${manager.name} · ${manager.email}` }))} />} /> : <>
            {input('managerName', 'Nome do gestor *', 'Nome completo')}
            {input('managerEmail', 'E-mail de acesso *', 'gestor@empresa.com')}
            {input('managerCpf', 'CPF do gestor *', '11 dígitos', 'number')}
            {input('managerPassword', 'Senha inicial *', 'Mínimo de 8 caracteres', 'password')}
          </>}
        </View>
        <View style={styles.saveArea}><Button title={saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar organização e gestor'} onPress={handleSubmit(submit)} disabled={saving || !isDirty && isEdit} /></View>
      </KeyboardAwareScrollView>
    </View>
  </FormAccessProvider>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: 16, paddingBottom: 36, gap: 14 }, introCard: { borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }, heroIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, heroText: { flex: 1, gap: 4 }, heroTitle: { fontSize: 17, fontWeight: '800' }, section: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 14 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 2 }, sectionTitle: { fontSize: 16, fontWeight: '800' }, help: { fontSize: 13, lineHeight: 19 }, saveArea: { marginTop: 3 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' } });

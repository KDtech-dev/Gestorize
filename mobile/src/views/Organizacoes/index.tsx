import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Nav from '@components/utilities/Nav';
import { RootStackParamList } from '@context/types';
import { useTheme } from '@context/ThemeContext';
import { createOrganizacao, getOrganizacoes, OrganizationType, updateOrganizacao } from '@api/apiOrganizacoes';

type Props = NativeStackScreenProps<RootStackParamList, 'Organizacoes'>;
type FormState = { name: string; document: string; email: string; phone: string; managerName: string; managerEmail: string; managerPassword: string; managerCpf: string };
const initialForm: FormState = { name: '', document: '', email: '', phone: '', managerName: '', managerEmail: '', managerPassword: '', managerCpf: '' };

const Organizacoes = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [organizations, setOrganizations] = useState<OrganizationType[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setOrganizations(await getOrganizacoes()); }
    catch { Toast.show({ type: 'error', text1: 'Não foi possível carregar as organizações.' }); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const field = (key: keyof FormState, label: string, placeholder: string, secureTextEntry = false) => (
    <View style={styles.field} key={key}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput value={form[key]} onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
        placeholder={placeholder} placeholderTextColor={colors.muted} secureTextEntry={secureTextEntry}
        autoCapitalize={key.toLowerCase().includes('email') ? 'none' : 'words'}
        style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]} />
    </View>
  );

  const submit = async () => {
    if (!form.name.trim() || (!editingId && (!form.managerName.trim() || !form.managerEmail.trim() || form.managerPassword.length < 8 || form.managerCpf.replace(/\D/g, '').length !== 11))) {
      Toast.show({ type: 'error', text1: 'Preencha os dados da organização e do gestor, incluindo CPF e senha de pelo menos 8 caracteres.' });
      return;
    }
    setSaving(true);
    try {
      const organizationData = { name: form.name.trim(), document: form.document.trim() || null, email: form.email.trim() || null, phone: form.phone.trim() || null };
      if (editingId) await updateOrganizacao(editingId, organizationData);
      else await createOrganizacao({
        ...organizationData,
        manager: { name: form.managerName.trim(), email: form.managerEmail.trim(), password: form.managerPassword, cpf: form.managerCpf.replace(/\D/g, '') },
      });
      const wasEditing = !!editingId;
      setEditingId(null);
      setForm(initialForm);
      Toast.show({ type: 'success', text1: wasEditing ? 'Parâmetros atualizados' : 'Organização criada', text2: wasEditing ? undefined : 'O gestor já pode acessar a própria organização.' });
      await load();
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Confira os dados e tente novamente.';
      Toast.show({ type: 'error', text1: 'Não foi possível criar', text2: message });
    } finally { setSaving(false); }
  };

  const toggleOrganization = async (organization: OrganizationType) => {
    try {
      await updateOrganizacao(organization.id, { active: !organization.active });
      await load();
    } catch {
      Toast.show({ type: 'error', text1: 'Não foi possível atualizar a organização.' });
    }
  };

  const editOrganization = (organization: OrganizationType) => {
    setEditingId(organization.id);
    setForm({ ...initialForm, name: organization.name, document: organization.document ?? '', email: organization.email ?? '', phone: organization.phone ?? '' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Nav title="Organizações" subtitle="Administração global" onBackPress={() => navigation.goBack()} rightType="menu" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heading}><MaterialCommunityIcons name={editingId ? 'domain-edit' : 'domain-plus'} size={23} color={colors.primary} /><Text style={[styles.title, { color: colors.text }]}>{editingId ? 'Parâmetros da organização' : 'Nova organização'}</Text></View>
          <Text style={[styles.help, { color: colors.muted }]}>Cada organização terá seus próprios cadastros e um gestor responsável.</Text>
          {field('name', 'Nome da organização *', 'Ex.: Loja Centro')}
          {field('document', 'CNPJ', '00.000.000/0000-00')}
          {field('email', 'E-mail da organização', 'contato@empresa.com')}
          {field('phone', 'Telefone', '(00) 00000-0000')}
          {!editingId ? <>
            <Text style={[styles.subheading, { color: colors.text }]}>Gestor inicial</Text>
            {field('managerName', 'Nome *', 'Nome do gestor')}
            {field('managerEmail', 'E-mail de acesso *', 'gestor@empresa.com')}
            {field('managerCpf', 'CPF do gestor *', 'Somente os 11 dígitos')}
            {field('managerPassword', 'Senha inicial *', 'Mínimo de 8 caracteres', true)}
          </> : null}
          <Pressable onPress={submit} disabled={saving} style={[styles.button, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{editingId ? 'Salvar parâmetros' : 'Criar organização e gestor'}</Text>}
          </Pressable>
          {editingId ? <Pressable onPress={() => { setEditingId(null); setForm(initialForm); }} style={styles.cancelButton}><Text style={[styles.cancelText, { color: colors.muted }]}>Cancelar edição</Text></Pressable> : null}
        </View>

        <View style={styles.listHeading}><Text style={[styles.title, { color: colors.text }]}>Organizações cadastradas</Text>{loading ? <ActivityIndicator color={colors.primary} /> : null}</View>
        {organizations.map((organization) => (
          <View key={organization.id} style={[styles.organization, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}><Text style={[styles.orgName, { color: colors.text }]}>{organization.name}</Text><Text style={[styles.orgMeta, { color: colors.muted }]}>{organization.document || 'Sem CNPJ'} · {organization.users_count} usuário(s)</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Editar parâmetros de ${organization.name}`} onPress={() => editOrganization(organization)} style={styles.editAction}><Text style={[styles.editText, { color: colors.primary }]}>Editar</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => toggleOrganization(organization)} style={[styles.status, { backgroundColor: organization.active ? '#DCFCE7' : '#FEE2E2' }]}><Text style={{ color: organization.active ? '#166534' : '#991B1B', fontSize: 11, fontWeight: '800' }}>{organization.active ? 'ATIVA' : 'INATIVA'}</Text></Pressable>
          </View>
        ))}
        {!loading && organizations.length === 0 ? <Text style={[styles.help, { color: colors.muted }]}>Nenhuma organização cadastrada.</Text> : null}
      </ScrollView>
    </View>
  );
};

export default Organizacoes;

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 16, paddingBottom: 36, gap: 14 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 13 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  title: { fontSize: 18, fontWeight: '800' }, help: { fontSize: 13, lineHeight: 19 }, field: { gap: 6 }, label: { fontSize: 13, fontWeight: '700' },
  input: { height: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 }, subheading: { marginTop: 5, fontSize: 15, fontWeight: '800' },
  button: { minHeight: 48, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginTop: 5 }, buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' }, cancelButton: { alignItems: 'center', paddingVertical: 4 }, cancelText: { fontSize: 13, fontWeight: '700' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 }, organization: { padding: 14, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  orgName: { fontSize: 15, fontWeight: '800' }, orgMeta: { fontSize: 12, marginTop: 4 }, status: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 }, editAction: { paddingHorizontal: 5, paddingVertical: 8 }, editText: { fontSize: 12, fontWeight: '800' },
});

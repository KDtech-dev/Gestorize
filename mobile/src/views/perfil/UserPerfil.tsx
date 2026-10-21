import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Nav from '@components/utilities/Nav';
import Avatar from '@components/Avatar';
import { getCurrentUser } from '@api/apiAuth';
import { useAuth } from '@context/AuthContext';
import { EnderecoType, RootStackParamList, UserType } from '@context/types';
import { useTheme } from '@context/ThemeContext';
import { dateFromApi, formatCpf, formatTelefone } from '@core/utils/format';
import Toast from 'react-native-toast-message';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const perfis: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  funcionario: 'Funcionário',
  cliente: 'Cliente',
};

const nomePerfil = (role?: string | null) => perfis[role?.toLowerCase() ?? ''] ?? 'Usuário';

const UserPerfil = () => {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [perfil, setPerfil] = useState<UserType | null>(user ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    getCurrentUser()
      .then((response) => {
        if (ativo) setPerfil(response.data);
      })
      .catch((error: any) => {
        Toast.show({
          type: 'error',
          text1: 'Não foi possível atualizar os dados do perfil',
          text2: error?.response?.data?.message ?? 'Exibindo os dados disponíveis da conta.',
        });
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => { ativo = false; };
  }, []);

  const endereco = perfil?.funcionario?.endereco;
  const dadosPessoais = perfil?.funcionario;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Nav
        title="Meu perfil"
        subtitle={nomePerfil(perfil?.role ?? user?.role)}
        onBackPress={() => navigation.goBack()}
        rightType="menu"
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 10 }}>Carregando seus dados...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.identity}>
            <Avatar
              nome={perfil?.nome ?? perfil?.name ?? user?.nome ?? 'Usuário'}
              imageUri={perfil?.avatar_url ?? null}
              size={118}
              editable={false}
            />
            <Text style={[styles.name, { color: colors.text }]}>
              {perfil?.nome ?? perfil?.name ?? user?.nome ?? 'Usuário'}
            </Text>
            <Text style={[styles.email, { color: colors.muted }]}>
              {perfil?.email ?? user?.email ?? 'E-mail não informado'}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados cadastrados</Text>
          <Info label="Telefone" value={dadosPessoais?.telefone ? formatTelefone(dadosPessoais.telefone) : null} />
          <Info label="CPF" value={dadosPessoais?.cpf ? formatCpf(dadosPessoais.cpf) : null} />
          <Info label="Data de nascimento" value={dadosPessoais?.data_nascimento ? dateFromApi(dadosPessoais.data_nascimento.slice(0, 10)) : null} />
          <Address address={endereco} />
        </ScrollView>
      )}
    </View>
  );
};

const Info = ({ label, value }: { label: string; value?: string | null }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value || 'Não informado'}</Text>
    </View>
  );
};

const Address = ({ address }: { address?: EnderecoType | null }) => {
  if (!address) return <Info label="Endereço" value={null} />;
  const linha = [
    address.logradouro,
    address.numero,
    address.complemento,
    address.bairro,
    address.cidade,
    address.estado,
    address.cep,
  ].filter(Boolean).join(', ');
  return <Info label="Endereço" value={linha || null} />;
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 32 },
  identity: { alignItems: 'center', paddingVertical: 18, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '900', marginTop: 12 },
  email: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  infoCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 10 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 5 },
  value: { fontSize: 16, fontWeight: '700' },
});

export default UserPerfil;

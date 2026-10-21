import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import Nav from '@components/utilities/Nav';
import Selector from '@components/Selector';
import DateField from '@components/DateField';
import InputCard from '@components/InputCard';
import Button from '@components/botoes/Button';
import { getClientes } from '@api/apiClientes';
import { createOrcamento, deleteOrcamento, getOrcamento, updateOrcamento } from '@api/apiOrcamentos';
import { ClienteType, RootStackParamList } from '@context/types';
import { useTheme } from '@context/ThemeContext';
import Toast from 'react-native-toast-message';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = NativeStackScreenProps<RootStackParamList, 'NovoOrcamento'>['route'];

const dataHoje = () => {
  const hoje = new Date();
  return `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
};

const dataParaApi = (data: string) => {
  const [dia, mes, ano] = data.split('/');
  return `${ano}-${mes}-${dia}`;
};

const moedaParaNumero = (valor: string) => {
  const normalizado = valor.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return Number(normalizado);
};

export default function NovoOrcamento() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const modo = route.params?.modo ?? 'criar';
  const orcamentoId = route.params?.orcamentoId;
  const editando = modo === 'editar';
  const [clientes, setClientes] = useState<ClienteType[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [data, setData] = useState(dataHoje());
  const [valor, setValor] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const opcoesClientes = useMemo(() => clientes.map((cliente) => ({ id: cliente.id, nome: cliente.nome })), [clientes]);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const clientesResponse = await getClientes();
      setClientes(clientesResponse.data ?? []);

      if (editando && orcamentoId) {
        const response = await getOrcamento(orcamentoId);
        const orcamento = response.data;
        setClienteId(orcamento.cliente_id);
        const [ano, mes, dia] = orcamento.data_orcamento.split('-');
        setData(`${dia}/${mes}/${ano}`);
        setValor(Number(orcamento.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar orçamento', text2: error?.response?.data?.message });
      if (editando) navigation.goBack();
    } finally {
      setCarregando(false);
    }
  }, [editando, navigation, orcamentoId]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const salvar = async () => {
    const valorTotal = moedaParaNumero(valor);
    if (!clienteId || !data || !Number.isFinite(valorTotal) || valorTotal < 0) {
      Toast.show({ type: 'error', text1: 'Confira os campos do orçamento' });
      return;
    }

    try {
      setSalvando(true);
      const payload = { cliente_id: clienteId, data_orcamento: dataParaApi(data), valor_total: valorTotal };
      if (editando && orcamentoId) {
        await updateOrcamento(orcamentoId, payload);
      } else {
        await createOrcamento(payload);
      }
      Toast.show({ type: 'success', text1: editando ? 'Orçamento atualizado' : 'Orçamento criado' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Não foi possível salvar', text2: error?.response?.data?.message ?? 'Verifique os dados e tente novamente.' });
    } finally {
      setSalvando(false);
    }
  };

  const excluir = () => {
    if (!orcamentoId) return;
    Alert.alert('Excluir orçamento', 'Deseja remover este orçamento?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await deleteOrcamento(orcamentoId);
          Toast.show({ type: 'success', text1: 'Orçamento removido' });
          navigation.goBack();
        } catch (error: any) {
          Toast.show({ type: 'error', text1: 'Não foi possível excluir', text2: error?.response?.data?.message });
        }
      } },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Nav title={editando ? 'Editar orçamento' : 'Novo orçamento'} subtitle={editando ? 'Atualize os dados' : 'Preencha os dados do orçamento'} onBackPress={() => navigation.goBack()} rightType="menu" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Dados do orçamento</Text>
        <Selector label="Cliente" placeholder={carregando ? 'Carregando clientes...' : 'Selecione um cliente'} value={clienteId} options={opcoesClientes} loading={carregando} onChange={setClienteId} />
        <DateField label="Data do orçamento" value={data} onChange={setData} />
        <InputCard label="Valor total" value={valor} onChangeText={setValor} placeholder="0,00" tipo="number" keyboardType="decimal-pad" />
        <View style={styles.actions}>
          {editando && <Button title="Excluir orçamento" variant="delete" disabled={salvando} onPress={excluir} />}
          <Button title={salvando ? 'Salvando...' : 'Salvar orçamento'} disabled={salvando || carregando} onPress={salvar} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 36, gap: 10 },
  sectionTitle: { color: '#062046', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  actions: { marginTop: 22, gap: 12 },
});

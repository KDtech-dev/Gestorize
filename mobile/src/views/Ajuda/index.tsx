import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Divider, List, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Nav from '@components/utilities/Nav';
import Button from '@components/botoes/Button';
import InputCard from '@components/InputCard';
import SearchBar from '@components/ui/SearchBar';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { enviarContatoAjuda } from '@api/apiAjuda';

const perguntas = [
  {
    titulo: 'Como registrar uma venda?',
    texto: 'Na página inicial, toque em Vender +. No caixa, adicione produtos pela busca ou câmera, ou escolha um orçamento aprovado. Confira o cliente, aplique desconto se necessário, selecione a forma de pagamento e toque em Finalizar venda. O estoque é atualizado após a confirmação.',
  },
  {
    titulo: 'Onde consulto o histórico e o faturamento das vendas?',
    texto: 'Use o acesso rápido Vendas para abrir o painel de controle. Ele mostra vendas do dia, faturamento, ticket médio, operadores e o histórico detalhado. A visualização depende da permissão vendas.ver; registrar vendas depende do acesso de venda do seu perfil.',
  },
  {
    titulo: 'Como cadastro um cliente, produto ou fornecedor?',
    texto: 'Abra a área correspondente em Acesso Rápido. Use o botão de adicionar para preencher os dados e salvar. Os campos obrigatórios são indicados no próprio formulário.',
  },
  {
    titulo: 'Como funciona a aprovação de orçamento?',
    texto: 'Orçamentos novos ficam pendentes. Abra um orçamento para conferir cliente, produtos e valores. Quando estiver correto, use a ação Aprovar. Um orçamento aprovado fica bloqueado para edição.',
  },
  {
    titulo: 'Como salvar um relatório em PDF?',
    texto: 'Abra Relatórios e selecione Hoje, Semana, Mês ou Ano. Os indicadores e gráficos são atualizados para o período escolhido. Toque em Imprimir ou salvar em PDF e, no diálogo do dispositivo, escolha uma impressora ou a opção para salvar o arquivo.',
  },
  {
    titulo: 'Como compartilhar ou imprimir um comprovante?',
    texto: 'Ao concluir uma venda, use Compartilhar comprovante para abrir as opções do dispositivo ou Imprimir comprovante para selecionar uma impressora. Você também pode abrir Vendas, expandir o registro no histórico e compartilhar ou imprimir novamente. O comprovante é gerado em PDF no formato A4.',
  },
  {
    titulo: 'Por que uma opção não aparece para mim?',
    texto: 'A disponibilidade das áreas e ações depende das permissões associadas ao seu perfil. Peça ao administrador do sistema para revisar seus acessos.',
  },
  {
    titulo: 'Como encerrar ou manter minha sessão?',
    texto: 'Use a opção Sair em Configurações. No login, marque Lembre de mim para restaurar a sessão ao reabrir o aplicativo. Toda sessão é encerrada automaticamente após três horas.',
  },
];

const etapas = [
  {
    titulo: 'Acesse a área certa',
    texto: 'Na página inicial, use os acessos principais para abrir cadastros e relatórios. Entre em Vender + para iniciar uma venda ou em Vendas para consultar o histórico.',
  },
  {
    titulo: 'Escolha como iniciar a venda',
    texto: 'No caixa, localize produtos pela busca, digite o código de barras ou leia pela câmera. Para usar uma proposta aprovada, selecione o orçamento e carregue os itens e o cliente.',
  },
  {
    titulo: 'Revise os itens e o cliente',
    texto: 'Confira os nomes, preços e quantidades. Verifique o estoque disponível e confirme ou selecione o cliente antes de seguir.',
  },
  {
    titulo: 'Defina desconto e pagamento',
    texto: 'Informe o desconto como percentual ou valor em reais, escolha Pix, dinheiro, débito ou crédito e confira o total final.',
  },
  {
    titulo: 'Finalize e acompanhe',
    texto: 'Toque em Finalizar venda para registrar a operação e atualizar o estoque. Na confirmação, você pode imprimir ou compartilhar o comprovante. Depois, consulte os indicadores e o histórico na área Vendas.',
  },
];

const Ajuda = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const corEtapa = isDark ? '#2563EB' : colors.primary;
  const { user } = useAuth();
  const [perguntaAberta, setPerguntaAberta] = useState<string | undefined>();
  const [busca, setBusca] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const termoBusca = busca.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const perguntasFiltradas = perguntas.filter((pergunta) => `${pergunta.titulo} ${pergunta.texto}`
    .toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(termoBusca));

  const enviarMensagem = async () => {
    const texto = mensagem.trim();
    if (texto.length < 10) {
      Toast.show({ type: 'info', text1: 'Conte um pouco mais', text2: 'A mensagem precisa ter ao menos 10 caracteres.' });
      return;
    }
    setEnviando(true);
    try {
      await enviarContatoAjuda(texto);
      setMensagem('');
      Toast.show({ type: 'success', text1: 'Mensagem enviada', text2: 'O suporte Gestorize recebeu seu report de ajuda.' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Não foi possível enviar', text2: error?.response?.data?.message ?? 'Verifique sua conexão e tente novamente.' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Nav
        title="Central de ajuda"
        subtitle="Orientações para usar o Gestorize"
        onBackPress={() => navigation.goBack()}
        rightType="menu"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Card mode="contained" style={[styles.introCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Card.Content>
            <View style={styles.introHeading}>
              <View style={[styles.introIcon, { backgroundColor: `${colors.primary}20` }]}><MaterialCommunityIcons name="lifebuoy" size={25} color={colors.primary} /></View>
              <View style={styles.introCopy}>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>CENTRAL GESTORIZE</Text>
                <Text style={[styles.introTitle, { color: colors.text }]}>Como podemos ajudar?</Text>
              </View>
            </View>
            <Text style={[styles.body, { color: colors.muted }]}>
              Pesquise uma dúvida, siga o passo a passo de vendas ou envie uma mensagem ao suporte. As respostas abaixo cobrem as principais funções do aplicativo.
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.sectionHeading}>
          <View><Text style={[styles.sectionTitle, { color: colors.text }]}>Comece por aqui</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>Fluxo rápido para registrar uma venda</Text></View>
          <MaterialCommunityIcons name="cart-check" size={23} color={colors.primary} />
        </View>
        <Card mode="outlined" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Card.Content style={styles.steps}>
            {etapas.map((etapa, index) => <React.Fragment key={etapa.titulo}>
              {index > 0 ? <Divider style={{ backgroundColor: colors.border }} /> : null}
              <View style={styles.stepRow}>
                <Text style={[styles.stepNumber, { backgroundColor: corEtapa }]}>{index + 1}</Text>
                <View style={styles.stepCopy}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>{etapa.titulo}</Text>
                  <Text style={[styles.body, { color: colors.muted }]}>{etapa.texto}</Text>
                </View>
              </View>
            </React.Fragment>)}
          </Card.Content>
        </Card>

        <View style={styles.sectionHeading}>
          <View><Text style={[styles.sectionTitle, { color: colors.text }]}>Dúvidas frequentes</Text><Text style={[styles.sectionHint, { color: colors.muted }]}>Busque por assunto ou palavra-chave</Text></View>
          <Text style={[styles.resultCount, { color: colors.muted }]}>{perguntasFiltradas.length}</Text>
        </View>
        <SearchBar value={busca} onChangeText={setBusca} placeholder="Ex.: vendas, orçamento, PDF" accessibilityLabel="Buscar dúvidas de ajuda" />
        <View style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {perguntasFiltradas.length ? perguntasFiltradas.map((pergunta, index) => (
            <React.Fragment key={pergunta.titulo}>
              {index > 0 ? <Divider style={{ backgroundColor: colors.border }} /> : null}
              <List.Accordion
                title={pergunta.titulo}
                titleNumberOfLines={3}
                expanded={perguntaAberta === pergunta.titulo}
                onPress={() => setPerguntaAberta((atual) => atual === pergunta.titulo ? undefined : pergunta.titulo)}
                titleStyle={[styles.question, { color: colors.text }]}
                style={{ backgroundColor: colors.card }}
                rippleColor={colors.border}
              >
                <Text style={[styles.answer, { color: colors.muted }]}>{pergunta.texto}</Text>
              </List.Accordion>
            </React.Fragment>
          )) : <Text style={[styles.noResults, { color: colors.muted }]}>Não encontrei uma resposta com esse termo. Tente outra palavra ou envie sua dúvida ao suporte.</Text>}
        </View>

        <Card mode="outlined" style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Card.Content>
            <View style={styles.supportHeading}>
              <View style={[styles.supportIcon, { backgroundColor: `${colors.primary}20` }]}><MaterialCommunityIcons name="message-question-outline" size={22} color={colors.primary} /></View>
              <View style={styles.supportCopy}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Ainda precisa de ajuda?</Text>
                <Text style={[styles.body, { color: colors.muted, marginTop: 3 }]}>Envie os detalhes para o suporte Gestorize. O e-mail da sua conta será incluído para que possamos responder.</Text>
              </View>
            </View>
            <InputCard
              label="E-mail da conta"
              value={user?.email ?? ''}
              editable={false}
              accessibilityLabel="E-mail associado ao report"
              containerStyle={[styles.inputContainer, styles.emailInput, { backgroundColor: colors.elevated, borderColor: colors.border }]}
              labelStyle={[styles.inputLabel, { color: colors.muted }]}
              inputStyle={[styles.inputText, { color: colors.muted }]}
              placeholderTextColor={colors.muted}
            />
            <InputCard
              label="Como podemos ajudar?"
              value={mensagem}
              onChangeText={setMensagem}
              placeholder="Descreva o que aconteceu e em qual tela. Não inclua senhas ou dados sensíveis."
              multiline
              maxLength={5000}
              textAlignVertical="top"
              accessibilityLabel="Mensagem para o suporte Gestorize"
              containerStyle={[styles.inputContainer, styles.messageInput, { backgroundColor: colors.background, borderColor: colors.border }]}
              labelStyle={[styles.inputLabel, { color: colors.text }]}
              inputStyle={[styles.inputText, styles.multilineInput, { color: colors.text }]}
              placeholderTextColor={colors.muted}
            />
            <Text style={[styles.characterCount, { color: colors.muted }]}>{mensagem.length}/5000</Text>
            <Button title={enviando ? 'Enviando...' : 'Enviar mensagem'} onPress={enviarMensagem} disabled={enviando || mensagem.trim().length < 10 || !user?.email} />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

export default Ajuda;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 36, gap: 12 },
  introCard: { borderRadius: 18, borderWidth: 1 },
  introHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  introIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  introCopy: { flex: 1, gap: 3 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  introTitle: { fontSize: 21, lineHeight: 26, fontWeight: '900' },
  body: { fontSize: 14, lineHeight: 21 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  sectionHint: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  resultCount: { fontSize: 13, fontWeight: '800' },
  card: { borderRadius: 16, overflow: 'hidden' },
  faqCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  steps: { gap: 13 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: { width: 27, height: 27, borderRadius: 14, color: '#FFFFFF', textAlign: 'center', textAlignVertical: 'center', fontWeight: '900', overflow: 'hidden' },
  stepCopy: { flex: 1, gap: 3 },
  stepTitle: { fontSize: 15, fontWeight: '800' },
  question: { fontSize: 14, fontWeight: '700' },
  answer: { fontSize: 14, lineHeight: 21, paddingHorizontal: 16, paddingBottom: 17, paddingTop: 2 },
  noResults: { fontSize: 14, lineHeight: 21, padding: 16 },
  supportCard: { borderRadius: 16, marginTop: 5 },
  supportHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 8 },
  supportIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  supportCopy: { flex: 1, gap: 2 },
  inputContainer: { width: '100%', height: 'auto', maxWidth: '100%', backgroundColor: 'transparent', borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9, marginBottom: 11, justifyContent: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '800', marginTop: 0, marginBottom: 5 },
  inputText: { fontSize: 15, lineHeight: 21, fontWeight: '500', paddingVertical: 0 },
  emailInput: { minHeight: 65 },
  messageInput: { minHeight: 185, justifyContent: 'flex-start' },
  multilineInput: { minHeight: 115, paddingTop: 1 },
  characterCount: { textAlign: 'right', fontSize: 12, marginTop: 5, marginBottom: 8 },
});

import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Card, Divider, List, Text } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import Nav from '@components/utilities/Nav';
import Button from '@components/botoes/Button';
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
    texto: 'Na tela Relatórios, escolha o período e o tipo de informação e toque em Imprimir ou salvar em PDF. No diálogo do sistema, selecione Salvar como PDF ou a impressora desejada.',
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
    titulo: 'Abra a função que precisa',
    texto: 'Na página inicial, use Acessos principais para abrir cadastros e relatórios. Toque em Vender + para registrar uma venda ou em Vendas para consultar histórico e faturamento.',
  },
  {
    titulo: 'Escolha como iniciar a venda',
    texto: 'No caixa, adicione produtos pela busca ou pela câmera. Se a venda partir de uma proposta já aprovada, selecione o orçamento para carregar os itens e o cliente.',
  },
  {
    titulo: 'Revise os itens e o cliente',
    texto: 'Confira os produtos, quantidades e estoque disponível. Associe ou confirme o cliente antes de continuar.',
  },
  {
    titulo: 'Defina desconto e pagamento',
    texto: 'Informe o desconto como percentual ou valor em reais, escolha Pix, dinheiro, débito ou crédito e confira o total final.',
  },
  {
    titulo: 'Finalize e acompanhe',
    texto: 'Toque em Finalizar venda para registrar a operação e atualizar o estoque. Depois, abra Vendas para consultar faturamento do dia, ticket médio e detalhes do histórico. Nos relatórios, escolha o período para analisar ou exportar os dados.',
  },
];

const Ajuda = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const corEtapa = isDark ? '#2563EB' : colors.primary;
  const { user } = useAuth();
  const [perguntaAberta, setPerguntaAberta] = useState<string | undefined>();
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card mode="contained" style={[styles.introCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>GESTORIZE</Text>
            <Text style={[styles.introTitle, { color: colors.text }]}>Encontre orientação para cada etapa</Text>
            <Text style={[styles.body, { color: colors.muted }]}>
              Consulte os passos principais e as respostas para dúvidas comuns sobre cadastros, orçamentos, vendas, relatórios e acesso.
            </Text>
          </Card.Content>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Comece por aqui</Text>
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

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dúvidas frequentes</Text>
        <View style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {perguntas.map((pergunta, index) => (
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
          ))}
        </View>

        <Card mode="outlined" style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Card.Content>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Fale com o suporte</Text>
            <Text style={[styles.body, { color: colors.muted, marginTop: 5 }]}>
              Envie um report de ajuda Gestorize. Sua mensagem e o e-mail da sua conta serão encaminhados para kennedy@kdtech.dev.
            </Text>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Seu e-mail</Text>
            <TextInput
              value={user?.email ?? ''}
              editable={false}
              accessibilityLabel="E-mail associado ao report"
              style={[styles.input, styles.emailInput, { color: colors.muted, borderColor: colors.border, backgroundColor: colors.elevated }]}
            />
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Mensagem</Text>
            <TextInput
              value={mensagem}
              onChangeText={setMensagem}
              placeholder="Descreva sua dúvida ou problema"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={5000}
              textAlignVertical="top"
              accessibilityLabel="Mensagem para o suporte Gestorize"
              style={[styles.input, styles.messageInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
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
  introCard: { borderRadius: 18 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  introTitle: { fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 7 },
  body: { fontSize: 14, lineHeight: 21 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginTop: 8, marginBottom: 1 },
  card: { borderRadius: 16, overflow: 'hidden' },
  faqCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  steps: { gap: 13 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: { width: 27, height: 27, borderRadius: 14, color: '#FFFFFF', textAlign: 'center', textAlignVertical: 'center', fontWeight: '900', overflow: 'hidden' },
  stepCopy: { flex: 1, gap: 3 },
  stepTitle: { fontSize: 15, fontWeight: '800' },
  question: { fontSize: 14, fontWeight: '700' },
  answer: { fontSize: 14, lineHeight: 21, paddingHorizontal: 16, paddingBottom: 17, paddingTop: 2 },
  supportCard: { borderRadius: 16, marginTop: 5 },
  fieldLabel: { fontSize: 14, fontWeight: '800', marginTop: 15, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, fontSize: 15 },
  emailInput: { minHeight: 46, paddingVertical: 11 },
  messageInput: { minHeight: 140, paddingTop: 12, paddingBottom: 12 },
  characterCount: { textAlign: 'right', fontSize: 12, marginTop: 5, marginBottom: 8 },
});

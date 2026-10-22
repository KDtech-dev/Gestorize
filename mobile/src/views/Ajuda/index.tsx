import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Divider, List, Text } from 'react-native-paper';
import Nav from '@components/utilities/Nav';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@context/ThemeContext';

const perguntas = [
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

const Ajuda = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [perguntaAberta, setPerguntaAberta] = useState<string | undefined>();

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
              Consulte os passos principais e as respostas para dúvidas comuns sobre cadastros, orçamentos, relatórios e acesso.
            </Text>
          </Card.Content>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Comece por aqui</Text>
        <Card mode="outlined" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Card.Content style={styles.steps}>
            <View style={styles.stepRow}>
              <Text style={[styles.stepNumber, { backgroundColor: colors.primary }]}>1</Text>
              <View style={styles.stepCopy}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Acesse uma área</Text>
                <Text style={[styles.body, { color: colors.muted }]}>Use os atalhos da página inicial para abrir clientes, produtos, fornecedores, orçamentos ou relatórios.</Text>
              </View>
            </View>
            <Divider style={{ backgroundColor: colors.border }} />
            <View style={styles.stepRow}>
              <Text style={[styles.stepNumber, { backgroundColor: colors.primary }]}>2</Text>
              <View style={styles.stepCopy}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Consulte ou preencha</Text>
                <Text style={[styles.body, { color: colors.muted }]}>Use a busca e os filtros das listagens. Ao criar ou editar, confira os dados antes de salvar.</Text>
              </View>
            </View>
            <Divider style={{ backgroundColor: colors.border }} />
            <View style={styles.stepRow}>
              <Text style={[styles.stepNumber, { backgroundColor: colors.primary }]}>3</Text>
              <View style={styles.stepCopy}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Acompanhe os resultados</Text>
                <Text style={[styles.body, { color: colors.muted }]}>A página inicial resume indicadores. Relatórios permitem escolher período e visualizar os dados em gráficos ou PDF.</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Dúvidas frequentes</Text>
        <Card mode="outlined" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
        </Card>

        <Card mode="contained" style={[styles.supportCard, { backgroundColor: colors.elevated }]}>
          <Card.Content>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Precisa de mais ajuda?</Text>
            <Text style={[styles.body, { color: colors.muted, marginTop: 5 }]}>
              Entre em contato com o administrador da sua empresa. Ele pode orientar sobre o uso do sistema e solicitar ajustes de acesso.
            </Text>
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
  steps: { gap: 13 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: { width: 27, height: 27, borderRadius: 14, color: '#FFFFFF', textAlign: 'center', textAlignVertical: 'center', fontWeight: '900', overflow: 'hidden' },
  stepCopy: { flex: 1, gap: 3 },
  stepTitle: { fontSize: 15, fontWeight: '800' },
  question: { fontSize: 14, fontWeight: '700' },
  answer: { fontSize: 14, lineHeight: 21, paddingHorizontal: 16, paddingBottom: 17, paddingTop: 2 },
  supportCard: { borderRadius: 16, marginTop: 5 },
});

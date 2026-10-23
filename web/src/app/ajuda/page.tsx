'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';

const questions = [
  { title: 'Como cadastro um cliente, produto ou fornecedor?', answer: 'Abra a área correspondente no menu. Use o botão Novo cadastro, preencha os campos obrigatórios e salve. Seu cadastro fica disponível no mobile e na web porque ambos usam a mesma API.' },
  { title: 'Como funciona a aprovação de orçamento?', answer: 'Orçamentos novos ficam pendentes. Abra os detalhes para conferir cliente, produtos e valores. Quando estiver correto, use Aprovar. Orçamentos aprovados ficam bloqueados para edição.' },
  { title: 'Como salvar um relatório em PDF?', answer: 'Na tela Relatórios, escolha o período e o tipo de informação. Use a opção de imprimir do navegador e selecione Salvar como PDF.' },
  { title: 'Por que uma opção não aparece para mim?', answer: 'A disponibilidade das áreas e ações depende das permissões associadas ao seu perfil. Peça ao administrador do sistema para revisar seus acessos.' },
];

function HelpContent() {
  const [open, setOpen] = useState<number | null>(0);
  return <>
    <div className="page-heading"><div><span className="eyebrow">SUPORTE</span><h1>Central de ajuda</h1><p>Orientações para usar o Gestorize na web e no aplicativo.</p></div></div>
    <section className="help-intro"><span className="help-intro-mark">?</span><div><span className="eyebrow">GESTORIZE</span><h2>Encontre orientação para cada etapa</h2><p>Consulte os passos principais e as respostas para dúvidas comuns sobre cadastros, orçamentos, relatórios e acesso.</p></div></section>
    <section className="help-section"><div className="help-section-heading"><span className="eyebrow">PRIMEIROS PASSOS</span><h2>Comece por aqui</h2></div><div className="steps-grid">
      {[
        ['01', 'Acesse uma área', 'Use o menu para abrir clientes, produtos, fornecedores, orçamentos ou relatórios.'],
        ['02', 'Consulte ou preencha', 'Use a busca nas listagens. Ao criar ou editar, confira os dados antes de salvar.'],
        ['03', 'Acompanhe os resultados', 'O painel resume indicadores. Relatórios permitem escolher período e visualizar os dados.'],
      ].map(([number, title, copy]) => <article className="help-step" key={number}><span>{number}</span><div><strong>{title}</strong><p>{copy}</p></div></article>)}
    </div></section>
    <section className="help-section"><div className="help-section-heading"><span className="eyebrow">RESPOSTAS</span><h2>Dúvidas frequentes</h2></div><div className="faq-list">
      {questions.map((question, index) => <article className={`faq-item ${open === index ? 'is-open' : ''}`} key={question.title}><button className="faq-question" aria-expanded={open === index} onClick={() => setOpen(open === index ? null : index)}><span>{question.title}</span><span className="faq-chevron">{open === index ? '−' : '+'}</span></button>{open === index && <p className="faq-answer">{question.answer}</p>}</article>)}
    </div></section>
    <aside className="help-support"><span className="support-icon">i</span><div><strong>Precisa de mais ajuda?</strong><p>Entre em contato com o administrador da sua empresa para tirar dúvidas ou revisar seu acesso.</p></div></aside>
  </>;
}

export default function HelpPage() { return <AppShell><HelpContent /></AppShell>; }

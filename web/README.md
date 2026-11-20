# Gestorize Web

Aplicação web responsiva do Gestorize, construída com Next.js 16, React 19 e TypeScript. A aplicação usa a API Laravel do repositório; não acessa o banco de dados diretamente.

Leia também o [README principal](../README.md), o [guia do backend](../backend/README.md) e o [guia do mobile](../mobile/README.md).

## Requisitos

- Node.js 20.9 ou superior e npm.
- API Laravel em execução e acessível pelo processo Node do Next.

## Configuração local

```bash
cd web
npm install
cp .env.example .env.local
```

Configure o endereço base da API em `.env.local`:

```env
BACKEND_API_URL=http://127.0.0.1:8000/api
COOKIE_SECURE=false
```

`BACKEND_API_URL` é usado pelo proxy server-side do Next. O navegador chama `/api/proxy`; o proxy encaminha as requisições ao Laravel e adiciona o token de sessão sem expô-lo ao JavaScript do navegador. Em produção, use HTTPS e configure `COOKIE_SECURE=true`.

## Desenvolvimento e comandos

```bash
npm run dev
```

Acesse `http://localhost:3000`. Os outros comandos disponíveis em `package.json` são:

```bash
npm run build
npm run start
npm run typecheck
```

## Recursos

- Login, alteração de senha no primeiro acesso, perfil e navegação conforme permissões.
- Dashboard, clientes, produtos, fornecedores, funcionários e orçamentos.
- Caixa de vendas com busca e leitura de códigos de barras, desconto, cliente e forma de pagamento. Após salvar, o sistema confirma a venda e exibe o comprovante. A impressão abre o diálogo do navegador em layout térmico de 80 mm.
- Visão geral e histórico de vendas e relatórios com opção de impressão ou salvamento em PDF.
- Central de etiquetas com formatos A4 e rolos Brother, histórico de impressão e confirmação das operações.
- Administração global de organizações e permissões padrão para contas autorizadas.

## Sessão e segurança

O proxy guarda o token Sanctum em cookie `HttpOnly` com validade limitada à expiração do token (até três horas). Requisições de API passam pelo proxy Next, com `no-store`; a URL interna do backend não é enviada ao navegador. Em produção, publique a aplicação atrás de HTTPS e mantenha os segredos fora do repositório.

Para detalhes de rotas, envelopes de resposta e permissões, consulte a [documentação interativa da API](http://localhost:8000/api/docs/) com o backend iniciado. O guia de instalação e o índice da API estão em [backend/README.md](../backend/README.md).

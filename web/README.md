# Gestorize Web

Frontend responsivo em Next.js que usa a mesma API Laravel, autenticação Sanctum por token e banco de dados do aplicativo mobile.

Para visão geral do projeto e configuração do backend, consulte o [README principal](../README.md) e o [README da API](../backend/README.md). O guia do [aplicativo mobile](../mobile/README.md) cobre a configuração Expo.

## Executar localmente

Use Node.js 20.9 ou superior.

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Configure `BACKEND_API_URL` com o endereço acessível pelo processo Node do Next, incluindo `/api` (por exemplo, `http://127.0.0.1:8000/api`). Esse endereço é usado pelo proxy server-side; o navegador não recebe o token Sanctum nem precisa acessar a API diretamente.

O backend deve estar em execução. A sessão web guarda o token em cookie `HttpOnly` por até três horas, no mesmo limite definido pelo backend. Em produção HTTPS, defina `COOKIE_SECURE=true`.

## Escopo atual

Login, dashboard, navegação filtrada pelas permissões do usuário, listagem, busca e formulários de cadastro/edição para clientes, produtos, fornecedores, funcionários e orçamentos, aprovação e exclusão condicionadas às permissões, relatório por período e tipo, registro de vendas, central de ajuda, configurações e perfil do usuário.

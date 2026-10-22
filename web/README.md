# Gestorize Web

Frontend responsivo em Next.js que usa a mesma API Laravel, autenticação Sanctum por token e banco de dados do aplicativo mobile.

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

## Aplicativo mobile

O mobile pode apontar para essa mesma API com `EXPO_PUBLIC_API_URL`, por exemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:8000/api
```

No dispositivo físico, use o IP ou domínio do servidor Laravel acessível pela rede, não `localhost`. Os dois frontends compartilham os registros por meio da mesma API e do mesmo banco; não existe sincronização separada entre clientes.

## Escopo atual

Login, dashboard, navegação filtrada pelas permissões do usuário, listagem, busca e formulários de cadastro/edição para clientes, produtos, fornecedores, funcionários e orçamentos, aprovação e exclusão condicionadas às permissões, relatório por período e tipo, além de registro de vendas com seleção de produtos, quantidades e cliente opcional.

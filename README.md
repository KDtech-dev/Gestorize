# Gestorize

Sistema de gestão para micro e pequenas empresas, com uma API Laravel compartilhada pelas aplicações web e mobile. Clientes, produtos, fornecedores, orçamentos e vendas ficam centralizados no mesmo banco de dados.

## Aplicações

- **Backend (`backend/`)**: API REST em Laravel 12, PHP 8.2+, Sanctum para autenticação e Spatie Permission para papéis e permissões.
- **Web (`web/`)**: Next.js 16 e React 19, com interface responsiva baseada em MUI e ícones Iconify. Inclui tema claro e escuro.
- **Mobile (`mobile/`)**: React Native 0.86, Expo 57 e TypeScript.
- **Banco de dados**: MySQL. As aplicações web e mobile usam a mesma API e os mesmos registros.

Cada aplicação tem seu próprio guia de configuração: [API/backend](backend/README.md), [web](web/README.md) e [mobile](mobile/README.md).

## Funcionalidades

- Cadastro e consulta de clientes, produtos, fornecedores e funcionários.
- Cadastro de produtos com categoria, fornecedor, código de barras, estoque e imagens, incluindo imagem principal.
- Orçamentos associados a clientes e produtos, com estados **Pendente**, **Aprovado** e **Vendido**. Um orçamento convertido em venda recebe o estado Vendido e deixa de estar disponível para uma nova venda.
- Caixa de vendas para pesquisar produtos, selecionar cliente ou orçamento, aplicar desconto em porcentagem ou valor, escolher forma de pagamento e concluir a venda. A conclusão atualiza o estoque.
- Histórico de vendas, indicadores, movimentações e relatórios na versão web.
- Leitura de código de barras pela câmera ou por leitor conectado no aplicativo mobile.
- Geração e impressão de etiquetas de produtos com código de barras.
- Controle de acesso por papel e permissão.

## Organizações, papéis e acesso

Cada empresa é uma organização. Usuários e dados operacionais (clientes, fornecedores, produtos, orçamentos, vendas e etiquetas) pertencem a uma organização, e o backend limita as consultas à empresa do usuário autenticado. Categorias, unidades de medida, papéis e permissões são globais e compartilhados entre organizações.

- **Administrador global (`admin`)**: administra organizações e os padrões globais de permissões. A conta global não está vinculada a uma organização.
- **Gestor (`gestor`)**: administra a operação e os funcionários da própria organização. Pode cadastrar funcionários com papel Gestor ou Funcionário e adicionar permissões individuais.
- **Funcionário (`funcionario`)**: tem acesso operacional mais restrito, definido pelas permissões padrão e pelas permissões adicionais atribuídas à sua conta.
- **Cliente (`cliente`)**: papel previsto no catálogo, com acesso padrão à visualização de orçamentos; não é um perfil de funcionário.

O acesso efetivo combina permissões do papel com permissões individuais adicionais. Essas permissões controlam quais ações podem ser feitas; o vínculo à organização determina quais registros podem ser acessados. Consulte [organizações e permissões no guia do backend](backend/README.md#organizacoes-e-isolamento-dos-dados) para os detalhes.

## Requisitos

- PHP 8.2 ou superior e Composer.
- MySQL.
- Node.js e npm.
- Expo Go para abrir o aplicativo mobile em um dispositivo físico, se desejado.

## Configuração e execução

Inicie o backend antes das aplicações web e mobile.

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env
```

Configure `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD` no arquivo `.env`. Crie o banco de dados no MySQL e então execute:

```bash
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=0.0.0.0
```

A API ficará disponível em `http://localhost:8000/api`. Para acessar em um celular ou por outro dispositivo, use o IP da máquina que executa o Laravel no lugar de `localhost`.

Com o servidor local em execução, consulte a [documentação interativa da API](http://localhost:8000/api/docs/) para ver as rotas, permissões, parâmetros e exemplos de resposta.

O seeder principal cria permissões, papéis, usuários e dados demonstrativos, incluindo vendas feitas por mais de um usuário. Papéis, permissões, categorias e unidades de medida são globais e compartilhados entre organizações; os usuários e registros operacionais demonstrativos são associados à organização padrão. As credenciais de demonstração são:

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | `teste@email.com` | `123456` |
| Gestor | `gestor@example.com` | `123456` |
| Funcionário | `funcionario@example.com` | `123456` |

Essas credenciais são somente para desenvolvimento. Não as utilize em produção.

### 2. Aplicação web

Em outro terminal:

```bash
cd web
npm install
cp .env.example .env.local
```

No `.env.local`, configure o endereço interno da API Laravel:

```env
BACKEND_API_URL=http://127.0.0.1:8000/api
COOKIE_SECURE=false
```

Para desenvolvimento local, execute:

```bash
npm run dev
```

Acesse `http://localhost:3000`. Em produção com HTTPS, configure `COOKIE_SECURE=true`.

### 3. Aplicativo mobile

Em outro terminal:

```bash
cd mobile
npm install
cp .env.example .env
```

Configure `EXPO_PUBLIC_API_URL` no `.env` com a URL acessível pelo dispositivo, incluindo `/api`:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:8000/api
```

Substitua o IP pelo endereço da máquina que executa o backend. O celular e o computador precisam estar conectados à rede e o firewall deve permitir a porta `8000`. Inicie o Expo:

```bash
npx expo start
```

Leia o QR Code com o Expo Go.

## Seeders e dados demonstrativos

`php artisan migrate --seed` executa os seeders na ordem definida em `backend/database/seeders/DatabaseSeeder.php`. Eles criam dados de exemplo ligados entre si: usuários, clientes, fornecedores, produtos, orçamentos e vendas.

Para executar somente o seeder de vendas depois de preparar os demais dados:

```bash
cd backend
php artisan db:seed --class=VendasSeeder
```

Os seeders são destinados a ambientes de desenvolvimento e demonstração.

## Upload de imagens

As imagens são armazenadas no disco público do Laravel. Para o servidor PHP, configure limites apropriados no `php.ini`, por exemplo:

```ini
upload_max_filesize = 10M
post_max_size = 20M
max_file_uploads = 20
```

`post_max_size` deve ser igual ou maior que `upload_max_filesize`. Se o backend usar Apache ou PHP-FPM, confira o `php.ini` carregado pelo servidor web, que pode ser diferente do PHP CLI. Reinicie o servidor após alterar essas opções.

## Estrutura do repositório

```text
Gestorize/
├── backend/    # API Laravel, regras de negócio, migrations e seeders
├── mobile/     # Aplicativo React Native com Expo
└── web/        # Aplicação Next.js
```

## Segurança e configuração

- Não compartilhe arquivos `.env`, tokens ou credenciais reais.
- Use senhas próprias e permissões adequadas em ambientes de produção.
- Configure `APP_URL`, banco de dados, URL da API e cookies de acordo com o ambiente.
- O servidor de desenvolvimento do Laravel não deve ser usado como servidor de produção.

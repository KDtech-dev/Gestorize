# Gestorize

Sistema de gestão para micro e pequenas empresas, com uma API Laravel compartilhada pelas aplicações web e mobile. Clientes, produtos, fornecedores, orçamentos e vendas ficam centralizados no mesmo banco de dados.

## Aplicações

- **Backend (`backend/`)**: API REST em Laravel 12, PHP 8.2+, Sanctum para autenticação e Spatie Permission para papéis e permissões.
- **Web (`web/`)**: Next.js 16 e React 19, com interface responsiva baseada em MUI e ícones Iconify. Inclui tema claro e escuro.
- **Mobile (`mobile/`)**: React Native 0.86, Expo 57 e TypeScript.
- **Banco de dados**: MySQL. As aplicações web e mobile usam a mesma API e os mesmos registros.

Cada aplicação tem seu próprio guia de configuração: [API/backend](backend/README.md), [web](web/README.md) e [mobile](mobile/README.md).

## Funcionalidades do sistema

As aplicações web e mobile trabalham sobre a mesma API. As áreas e ações que cada usuário consegue acessar dependem das permissões da sua organização.

### Cadastros e catálogo

- **Clientes:** cadastro de pessoas físicas e jurídicas, com dados de contato, documentos, endereço e foto/avatar; busca, filtros, consulta de detalhes, edição e exclusão conforme as permissões.
- **Produtos:** cadastro de nome, código de barras, categoria, fornecedor, unidade de medida, preços, margem, estoque, datas e imagens. É possível definir a imagem principal e consultar os dados comerciais e de estoque nas listagens.
- **Fornecedores:** cadastro de dados da empresa, responsável, contatos, endereço, chave PIX, imagem e vários ramos de atividade.
- **Funcionários:** cadastro de usuário com foto, contatos e perfil de acesso. Gestores podem conceder permissões individuais adicionais e consultar as permissões efetivas.
- **Orçamentos:** propostas associadas a um cliente e a itens do catálogo, com quantidades e valores. Os estados são **Pendente**, **Aprovado** e **Vendido**; aprovar e converter em venda são ações controladas por permissão. Um orçamento vendido não pode ser usado novamente para criar uma venda.
- **Categorias e unidades de medida:** catálogos compartilhados pelas organizações para classificar e descrever produtos.

### Vendas e acompanhamento

- **Registro de venda:** pesquisa e inclusão de produtos, leitura de código de barras, seleção de cliente ou orçamento, ajuste de quantidades, desconto percentual ou em valor e escolha da forma de pagamento.
- **Conclusão:** registra a venda e atualiza o estoque pela API. As validações do backend protegem os dados e valores enviados pelas aplicações.
- **Visão geral web:** indicadores do dia, total e valor médio das vendas, operadores, histórico pesquisável e filtrável por forma de pagamento, além dos detalhes de cada venda.
- **Relatórios web:** consulta por período e categoria de dados, com indicadores, séries históricas e visualizações em colunas, área ou rosca; também permite pré-visualizar e imprimir/salvar em PDF.
- **Dashboard:** resumo da operação da organização e atalhos para áreas disponíveis ao usuário.

### Central de etiquetas

A central está disponível na web e no aplicativo mobile. Ela reúne produtos, seleção de quantidades, formatos de impressão, operações e histórico. A impressão é preparada pela aplicação e aberta no diálogo de impressão do navegador ou do sistema; a impressora deve estar configurada no dispositivo.

- **Seleção e busca:** localizar por nome, código de barras ou ID; filtrar todos, pendentes ou impressos; selecionar produtos visíveis ou individualmente e escolher de 1 a 50 cópias de cada produto.
- **Impressão em lote:** gerar etiquetas dos produtos selecionados, apenas dos pendentes ou de todos. Cada operação aceita até 5.000 etiquetas; operações maiores devem ser divididas.
- **Formatos disponíveis:**
  - **A4 Avery L7159:** 24 etiquetas por folha, em 3 colunas × 8 linhas; cada etiqueta mede 63,5 × 33,9 mm.
  - **Brother QL-800 com rolos DK:** DK-11209 (29 × 62 mm), DK-11201 (29 × 90 mm), DK-11208 (38 × 90 mm), DK-11202 (62 × 100 mm) e DK-22205 contínuo (62 mm de largura, corte em segmentos de 50 mm).
- **Conteúdo:** nome e preço do produto, categoria e unidade quando disponíveis, além de código de barras Code 39. Nas etiquetas da central, o código impresso é formado pelos 12 primeiros caracteres do ID do produto (sem hífens); o leitor envia esse valor à API, que resolve o prefixo para localizar o produto. O código de barras cadastrado continua disponível para busca quando usado na venda.
- **Pendente ou impresso:** o sistema compara uma assinatura dos dados impressos (nome, código, categoria, fornecedor, unidade e preço). Se esses dados mudarem depois da confirmação, a etiqueta volta a aparecer como pendente.
- **Histórico auditável:** a operação fica inicialmente **Aguardando confirmação**. Depois de verificar o resultado no diálogo de impressão, o usuário pode confirmar ou cancelar no histórico. Só a confirmação marca a versão atual da etiqueta como impressa; cancelar mantém os produtos pendentes quando aplicável. O histórico exibe usuário, data, produtos e quantidades.
- **Preferência de formato:** a escolha do formato fica salva no navegador ou no dispositivo mobile. Na impressão, confira se o tamanho de papel/rolo selecionado no diálogo e na impressora corresponde ao formato escolhido no Gestorize, sobretudo para rolos Brother.

### Acesso e organização

- Login, encerramento de sessão e alteração de senha no primeiro acesso.
- Tema claro/escuro na web, navegação adaptada a diferentes tamanhos de tela e interface mobile.
- Papéis e permissões controlam menus e operações; a API também valida cada ação. Permissões individuais são adicionais às herdadas do papel.
- O administrador global gerencia organizações e permissões padrão. Usuários da organização acessam apenas os registros operacionais da própria empresa.
- Perfil do usuário e configurações disponíveis de acordo com o papel. A área de ajuda permite enviar uma mensagem para suporte.

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

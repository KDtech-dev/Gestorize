# Gestorize API

API REST do Gestorize, desenvolvida em Laravel 12 e compartilhada pelos aplicativos web e mobile. A API concentra autenticação, regras de negócio, autorização e acesso ao banco de dados.

Consulte o [README principal](../README.md) para a visão geral do sistema e os guias de [web](../web/README.md) e [mobile](../mobile/README.md) para configurar os clientes.

## Requisitos

- PHP 8.2 ou superior com extensões exigidas pelo Laravel.
- Composer.
- MySQL.

## Instalação local

Na raiz do repositório:

```bash
cd backend
composer install
cp .env.example .env
```

No `.env`, informe a conexão MySQL (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD`). Crie o banco antes de executar:

```bash
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=0.0.0.0
```

A API ficará em `http://localhost:8000/api`. A documentação das rotas fica em `http://localhost:8000/api/docs/` e é servida do diretório público do Laravel. Use o IP da máquina no lugar de `localhost` quando um dispositivo da rede, como um celular, precisar acessar a API.

## Seeders

`DatabaseSeeder` executa os seeders na ordem definida em `database/seeders/DatabaseSeeder.php`:

1. `RolesSeeder`: cria permissões e papéis padrão (`admin`, `gestor`, `funcionario` e `cliente`) para o guard `api`.
2. `UnidadesMedidaSeeder` e `CategoriasSeeder`: cadastram unidades e categorias de produto globais, compartilhadas entre organizações.
3. Os demais seeders criam usuários de demonstração e registros operacionais da organização padrão: fornecedores, clientes, produtos, orçamentos e vendas.

Papéis, permissões, categorias e unidades de medida não são vinculados a uma organização. Os dados de demonstração de usuários e operação são vinculados à organização padrão para formar um fluxo de uso coerente.

Usuários de demonstração, todos com a senha `123456`:

| Perfil | E-mail |
|---|---|
| Administrador | `teste@email.com` |
| Gestor | `gestor@example.com` |
| Funcionário | `funcionario@example.com` |

As credenciais são exclusivas para desenvolvimento e demonstração. Não as use em produção. Para executar somente um seeder após preparar as dependências:

```bash
php artisan db:seed --class=VendasSeeder
```

## Autenticação e permissões

- O login é feito em `POST /api/login`; as rotas protegidas usam Laravel Sanctum.
- O middleware de contexto da organização delimita os registros operacionais para a organização do usuário autenticado.
- Rotas e ações verificam permissões como `produtos.ver`, `clientes.criar` e `users.editar`.
- O Gestor tem permissões para administrar funcionários e pode atribuir permissões individuais; os papéis também definem permissões padrão.
- O Funcionário pode consultar fornecedores, entre outras permissões padrão, para selecionar um fornecedor ao trabalhar com produtos.
- Categorias, unidades de medida, papéis e permissões são globais, independentes da organização.

O catálogo atual de permissões está em `app/Enums/PermissionEnum.php`, e os papéis padrão são montados por `database/seeders/RolesSeeder.php`.

## Organizações e isolamento dos dados

Cada empresa cadastrada é uma `Organization`. Usuários vinculados a ela carregam seu `organization_id`, e os registros operacionais também guardam esse identificador. O escopo global dos modelos e o middleware `tenant.context` restringem consultas e operações à organização do usuário autenticado; identificadores de outra organização não devem dar acesso aos respectivos registros. Assim, clientes, funcionários, fornecedores, produtos, orçamentos, vendas e operações de etiquetas pertencem a uma organização.

Categorias, unidades de medida, papéis e permissões são catálogos globais, sem `organization_id`. Eles são compartilhados por todas as organizações: uma categoria criada no catálogo global, por exemplo, pode ser usada em produtos de empresas diferentes. O seeder de dados de demonstração usa uma organização chamada **Organização padrão**, sem tornar esses catálogos globais em dados dessa organização.

O **Administrador global** é o usuário com papel `admin` e sem `organization_id`. Ele administra organizações e métricas globais e pode alterar as permissões padrão dos papéis. Não opera registros de uma empresa pelo fluxo normal da API; para isso, o usuário precisa estar vinculado à organização correspondente. Organizações inativas não podem usar as rotas operacionais.

## Papéis e permissões

Um papel define permissões padrão. As permissões nomeiam ações por área (`produtos.ver`, `clientes.criar`, `users.editar`, por exemplo). A API verifica a permissão em cada rota; a interface filtra menus e ações com base no mesmo acesso. O papel e o catálogo de permissões são globais, mas as permissões adicionais de usuário são atribuídas ao usuário dentro da sua organização.

| Papel | Uso e permissões padrão |
|---|---|
| `admin` — Administrador global | Acesso administrativo global. O `Gate::before` concede todas as permissões ao papel `admin`; a administração de organizações e dos papéis globais também exige que a conta não tenha organização vinculada. |
| `gestor` — Gestor | Administra a operação da própria organização: consulta, cria e edita clientes, produtos, fornecedores e orçamentos; consulta e registra vendas; administra usuários/funcionários; gerencia acessos e consulta relatórios. Pode cadastrar funcionários como `gestor` ou `funcionario`. |
| `funcionario` — Funcionário | Acesso operacional mais restrito: consulta e cadastra clientes, consulta produtos e fornecedores, consulta e cadastra orçamentos, e registra vendas. Não recebe por padrão edição de cadastros nem administração de equipe. |
| `cliente` — Cliente | Papel existente no catálogo; recebe `orcamentos.ver` como permissão padrão. Não é um perfil permitido no cadastro de funcionários da organização. |

O Gestor com `acessos.gerenciar` pode enviar uma lista de permissões individuais ao criar ou editar um usuário. Essa lista adiciona permissões além das herdadas do papel; não remove permissões concedidas pelo papel. Alterar permissões de um papel muda o padrão para todos os usuários desse papel, em todas as organizações, e é reservado ao administrador global. O papel `admin` não pode ser editado pelo fluxo de alteração de permissões de papel.

Em resumo, o acesso efetivo é a combinação das permissões do papel com as permissões individuais adicionais, enquanto o `organization_id` limita quais dados da empresa podem ser acessados. Ter uma permissão não permite atravessar o limite da organização.

## Áreas da API

As rotas estão em `routes/api.php`. Entre os recursos disponíveis estão autenticação e perfil, clientes, produtos, fornecedores, funcionários e acessos, orçamentos, vendas, relatórios, etiquetas, categorias e unidades de medida. A maioria das rotas exige autenticação e permissão correspondente.

## Uploads

Arquivos enviados são armazenados pelo Laravel. `php artisan storage:link` publica o disco configurado em `storage/app/public` por meio de `public/storage`. Ajuste os limites de upload no `php.ini` do servidor PHP, além das configurações do proxy web quando aplicável.

## Estrutura relacionada

```text
backend/
├── app/                 # modelos, controladores, middleware e regras de negócio
├── database/migrations/ # estrutura do banco
├── database/seeders/    # permissões e dados de demonstração
└── routes/api.php       # endpoints da API
```

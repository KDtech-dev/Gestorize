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

## Leitor de códigos e API de produtos

A câmera é controlada pelo aplicativo web ou mobile. O cliente decodifica a leitura e envia somente o texto para a API; nenhum endpoint recebe imagem ou vídeo da câmera. A API oferece dois fluxos: localizar um produto pela leitura e gravar códigos comerciais no cadastro.

### Localizar um produto pela leitura

```http
GET /api/produtos/codigo/{codigo}
Authorization: Bearer SEU_TOKEN
Accept: application/json
```

O cliente deve codificar caracteres reservados da URL ao enviar `{codigo}`. A rota exige Sanctum e o mesmo acesso da listagem de produtos: usuário vinculado a uma organização ativa e com papel `admin`, `gestor` ou `funcionario`, ou permissão `produtos.ver`, `vendas.ver` ou `vendas.criar`. A conta global sem organização não acessa esta rota.

A rota reconhece:

- O código interno legado `PRD...`, armazenado em `produtos.codigo_barras`.
- Um código comercial salvo em `produto_codigos_barras.codigo`.
- O prefixo hexadecimal de 8 a 32 caracteres do UUID impresso nas etiquetas próprias. Hífens são ignorados, e o prefixo precisa identificar um único produto.

Uma leitura encontrada retorna HTTP `200` no envelope padrão, com o produto em `data`, incluindo os campos `codigo_barras` e `codigos_barras`. Uma leitura sem correspondência retorna HTTP `404`. A rota não interpreta QR genérico ou imagem: o conteúdo decodificado precisa corresponder a um código salvo ou ao identificador de etiqueta reconhecido.

### Cadastrar códigos comerciais lidos

Na criação (`POST /api/produtos`) ou edição (`PUT /api/produtos/{produto}`), envie os códigos comerciais em `codigos_barras` como uma lista de textos:

```json
{
  "codigos_barras": ["00789123456789", "7891234567890"]
}
```

O campo é opcional e aceita até 20 códigos, cada um com até 64 caracteres. Zeros à esquerda são preservados. Os valores precisam ser distintos e não podem estar associados a outro produto da mesma organização; violações retornam HTTP `422`. O código interno `PRD...` permanece separado e não precisa ser enviado nessa lista.

Em `PUT`, omitir `codigos_barras` preserva a lista atual; enviar uma lista sincroniza os códigos comerciais; enviar `[]` remove todos os códigos comerciais associados. A tabela `produto_codigos_barras` armazena os valores como texto e aplica unicidade por organização.

As etiquetas próprias imprimem os 12 primeiros caracteres do UUID sem hífens em Code 39; esse prefixo é resolvido pela rota de busca acima.

### Migração existente

Em uma instalação existente, aplique a migração com `php artisan migrate` a partir de `backend/`. Ela cria a tabela complementar sem modificar UUIDs, estoque ou códigos internos já armazenados.

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

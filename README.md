# Gestorize

## Descrição do Projeto

O GestorizeMobile é um aplicativo mobile desenvolvido para auxiliar micro e pequenas empresas no gerenciamento de processos administrativos essenciais.

A aplicação permite organizar e controlar informações relacionadas a funcionários, clientes, produtos, fornecedores e orçamentos de forma centralizada.

O sistema é composto por uma API backend desenvolvida em Laravel, responsável pelas regras de negócio e pelo acesso aos dados, e um aplicativo mobile desenvolvido em React Native com Expo e TypeScript, responsável pela interface e interação com o usuário.

O banco de dados utilizado é o MySQL, garantindo a persistência das informações.

Também há uma aplicação web responsiva em Next.js no diretório `web/`. As versões web e mobile acessam a mesma API Laravel e, portanto, consultam e atualizam os mesmos dados.

## Funcionalidades

### Gestão de Funcionários

Permite o cadastro, a atualização e a visualização das informações dos colaboradores da empresa.

### Gerenciamento de Clientes

Possibilita registrar clientes, consultar seus dados e acompanhar o histórico de orçamentos vinculados.

### Controle de Produtos

Permite cadastrar produtos, atualizar preços, controlar o estoque e associar fornecedores aos itens cadastrados.

Também oferece suporte ao envio e gerenciamento de múltiplas imagens por produto, incluindo a definição da imagem principal.

### Gerenciamento de Fornecedores

Permite organizar as informações dos fornecedores associados às atividades da empresa.

### Criação de Orçamentos

Permite gerar orçamentos personalizados para clientes, editar informações e armazenar registros para consulta futura.

### Autenticação

O sistema utiliza Laravel Sanctum para autenticação por tokens de acesso à API, protegendo as rotas que exigem autenticação.

## Tecnologias Utilizadas

### Backend

- PHP
- Laravel
- MySQL
- Laravel Sanctum
- Eloquent ORM

### Mobile

- React Native
- Expo
- TypeScript
- Axios

### Web

- Next.js
- React
- TypeScript
- Proxy server-side para a API Laravel

## Requisitos para Execução

Antes de executar o projeto, certifique-se de possuir os seguintes recursos instalados:

- PHP em uma versão compatível com as dependências do projeto.
- Composer.
- MySQL.
- Node.js e npm.
- Expo CLI, disponibilizado por meio do comando `npx expo`.
- Aplicativo Expo Go no dispositivo móvel, caso utilize esse método de execução.

## Configuração do Backend

### 1. Acessar o diretório

```bash
cd backend
```

### 2. Instalar as dependências

```bash
composer install
```

### 3. Configurar as variáveis de ambiente

Crie o arquivo `.env` a partir do exemplo disponibilizado no projeto:

```bash
cp .env.example .env
```

Gere a chave da aplicação:

```bash
php artisan key:generate
```

Configure no arquivo `.env` as informações de conexão com o banco de dados MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=TCC
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
```

Substitua os valores de usuário, senha e banco de dados conforme o ambiente utilizado.

### 4. Executar as migrações

Após criar o banco de dados e configurar a conexão:

```bash
php artisan migrate
```

Execute os seeders, caso sejam necessários para a configuração inicial do sistema:

```bash
php artisan db:seed
```

### 5. Configurar o armazenamento de arquivos

O sistema utiliza o armazenamento público do Laravel para salvar imagens de produtos.

Execute:

```bash
php artisan storage:link
```

Verifique também se a variável `APP_URL` do arquivo `.env` corresponde ao endereço utilizado para acessar o backend.

Exemplo para execução local:

```env
APP_URL=http://192.168.0.104:8000
```

**Importante:** substitua o endereço IP pelo endereço da máquina que está executando o backend.

Ao utilizar um dispositivo físico, o endereço `127.0.0.1` ou `localhost` aponta para o próprio dispositivo, e não para o computador que executa o Laravel.

Por isso, o aplicativo mobile deve utilizar o endereço IP acessível do computador na rede local.

### 6. Configurar os limites de upload de imagens

O PHP possui limites para o tamanho dos arquivos enviados e das requisições HTTP. Esses limites podem impedir o envio de imagens maiores ou causar falhas durante o cadastro de produtos com galerias de imagens.

Para permitir o envio de imagens de até 10 MB, configure os seguintes parâmetros no arquivo `php.ini` utilizado pelo servidor PHP:

```ini
upload_max_filesize = 10M
post_max_size = 20M
max_file_uploads = 20
```

O parâmetro `memory_limit` pode permanecer com a configuração padrão do ambiente. Caso seja necessário defini-lo explicitamente, utilize um valor adequado aos recursos disponíveis no servidor.

#### Função de cada parâmetro

| Parâmetro | Descrição |
|---|---|
| `upload_max_filesize` | Define o tamanho máximo permitido para cada arquivo enviado. |
| `post_max_size` | Define o tamanho máximo total de uma requisição POST. |
| `max_file_uploads` | Define a quantidade máxima de arquivos enviados em uma única requisição. |

**Observação:** o `post_max_size` deve ser maior ou igual ao `upload_max_filesize`, pois a requisição também contém os dados de multipart/form-data.

No GestorizeMobile, as imagens são enviadas individualmente para a API. Portanto, o limite de arquivos por requisição não determina a quantidade total de imagens que podem compor a galeria de um produto.

A quantidade total também depende das regras de validação do backend e do limite configurado no aplicativo mobile.

#### Como verificar as configurações

No terminal, execute:

```bash
php -i | grep -E "upload_max_filesize|post_max_size|max_file_uploads|memory_limit"
```

O resultado deve apresentar os valores configurados para o PHP utilizado pelo comando.

Para identificar o arquivo de configuração carregado pelo PHP CLI, execute:

```bash
php --ini
```

**Atenção:** se o backend utilizar PHP-FPM ou Apache, verifique também o `php.ini` correspondente ao servidor web. A configuração do PHP CLI pode ser diferente.

#### Reiniciar o servidor

Se o projeto estiver sendo executado com o servidor de desenvolvimento do Laravel, interrompa o processo atual com `Ctrl + C` e execute novamente:

```bash
php artisan serve --host=0.0.0.0
```

A opção `--host=0.0.0.0` permite que outros dispositivos da rede local acessem o servidor, desde que o firewall e a configuração da rede permitam.

### 7. Executar o backend

Após concluir as configurações:

```bash
php artisan serve --host=0.0.0.0
```

Por padrão, o Laravel disponibiliza o servidor de desenvolvimento na porta `8000`.

## Configuração do Mobile

### 1. Acessar o diretório

Em outro terminal, acesse a pasta do aplicativo mobile:

```bash
cd mobile
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar o endereço da API

Configure o endereço base utilizado pelo Axios para acessar o backend.

Exemplo:

```text
http://192.168.0.104:8000/api
```

Utilize o endereço IP da máquina que executa o Laravel. Caso o projeto utilize variáveis de ambiente ou um arquivo de configuração específico para o endereço da API, atualize o valor nesse local.

O dispositivo móvel e o computador devem possuir conectividade entre si.

### 4. Executar o aplicativo

Inicie o Expo:

```bash
npx expo start
```

Leia o QR Code com o Expo Go para abrir o aplicativo no dispositivo móvel.

## Estrutura do Projeto

```text
GestorizeMobile/
├── backend/
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── storage/
│   ├── .env.example
│   └── artisan
│
└── mobile/
    ├── src/
    ├── assets/
    ├── app.json
    ├── package.json
    └── tsconfig.json
```

A estrutura apresentada é ilustrativa. Os diretórios e arquivos específicos podem variar conforme a organização atual do projeto.

## Observações Importantes

- O backend e o aplicativo mobile são executados separadamente.
- O backend precisa estar acessível pela rede para que o aplicativo consiga realizar requisições à API.
- O arquivo `.env` deve ser configurado de acordo com o ambiente de execução.
- As imagens dos produtos são armazenadas pelo Laravel no disco público.
- O limite de upload do PHP deve ser compatível com os tamanhos de imagem aceitos pela aplicação.
- Em ambientes de produção, configure limites de upload adequados aos recursos do servidor e às necessidades do sistema.
- Não compartilhe credenciais, tokens de acesso ou arquivos `.env` contendo informações sensíveis.

## Objetivo do Projeto

O GestorizeMobile tem como objetivo facilitar a organização administrativa de micro e pequenas empresas, oferecendo uma solução mobile para centralizar informações, simplificar tarefas e melhorar o controle operacional do negócio.

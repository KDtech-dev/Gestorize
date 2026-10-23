# Gestorize Mobile

Aplicativo do Gestorize desenvolvido em React Native, Expo e TypeScript. Ele usa a mesma API Laravel e os mesmos registros da aplicação web.

Consulte o [README principal](../README.md) para a visão geral e o guia do [backend](../backend/README.md) para instalar e iniciar a API.

## Requisitos

- Node.js e npm.
- Backend Gestorize configurado e acessível pela rede.
- Expo Go em um dispositivo físico, ou um emulador Android/iOS configurado.

## Configuração

Na raiz do repositório:

```bash
cd mobile
npm install
cp .env.example .env
```

Configure `EXPO_PUBLIC_API_URL` no `.env` com o endereço do backend e o sufixo `/api`:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:8000/api
```

Troque o IP pelo endereço da máquina que executa o Laravel. Em dispositivo físico, `localhost` aponta para o próprio celular; use o IP ou domínio do computador/servidor, mantenha os dispositivos na mesma rede e permita acesso à porta `8000`.

## Executar

```bash
npm start
```

O Expo exibirá um QR Code para abrir com o Expo Go. Também há comandos específicos nos scripts do `package.json`:

```bash
npm run android
npm run ios
npm run web
```

Os comandos Android e iOS requerem os respectivos emuladores ou ferramentas de desenvolvimento. O aplicativo inclui fluxo de vendas, leitura de código de barras, impressão/compartilhamento de etiquetas e consultas de gestão conforme as permissões do usuário.

# Gestorize Mobile

Aplicativo mobile do Gestorize, desenvolvido com Expo 58, React Native 0.88 e TypeScript. Ele compartilha a API Laravel e os dados com a aplicação web.

Consulte também o [README principal](../README.md), o [guia do backend](../backend/README.md) e o [guia web](../web/README.md).

## Requisitos

- Node.js 22.13 ou superior na série 22, ou 24.3 ou superior na série 24, e npm (requisitos do Expo 58).
- API Laravel configurada e acessível pela rede local ou por um domínio.
- Expo Go em um aparelho compatível ou emulador Android/iOS configurado.

## Configuração

```bash
cd mobile
npm install
cp .env.example .env
```

Defina `EXPO_PUBLIC_API_URL` em `.env`, incluindo `/api`:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:8000/api
```

Troque o endereço pelo IP ou domínio do backend. Em aparelho físico, `localhost` aponta para o próprio aparelho. O celular e o computador precisam estar na mesma rede e a porta do servidor Laravel deve estar liberada. Use HTTPS para serviços publicados.

## Executar

```bash
npm start
```

Escaneie o QR Code com o Expo Go. Os atalhos disponíveis são:

```bash
npm run android
npm run ios
npm run web
```

Os comandos Android e iOS dependem de emulador ou dispositivo configurado. `npm run web` inicia a variante web do projeto Expo.

## Recursos

- Login e sessão Sanctum; o token é armazenado usando armazenamento seguro do dispositivo e enviado como Bearer.
- Navegação e operações conforme papéis e permissões retornados pela API.
- Consultas e cadastros de clientes, produtos, fornecedores, funcionários e orçamentos.
- Caixa de vendas com câmera para leitura de código de barras, seleção de produtos e cliente, descontos e formas de pagamento.
- Confirmação da venda com toast; comprovante em bobina térmica selecionável de 58 mm ou 80 mm, impressão pelo sistema e compartilhamento do PDF pela folha nativa do dispositivo.
- Central de etiquetas com formatos A4 e rolos Brother, impressão, confirmação de operação e histórico.
- Dashboard, relatórios, perfil e suporte, conforme permissões.

## Câmera, impressão e compartilhamento

O acesso à câmera depende da permissão do sistema operacional. O aplicativo decodifica o código e consulta a API por texto; a imagem da câmera não é enviada ao backend.

A impressão de comprovantes e etiquetas usa os recursos de impressão do sistema. A disponibilidade de impressoras térmicas depende do serviço de impressão, driver e conexão suportados pelo Android ou iOS. O compartilhamento do comprovante gera um PDF e abre as opções oferecidas pelo aparelho.

Consulte a [documentação da API](http://localhost:8000/api/docs/) com o backend iniciado para conferir rotas, permissões e formatos das respostas.

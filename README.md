# Captive Portal - Gorillas Hamburgueria

Site estático no GitHub Pages + backend de autorização real via Firebase Cloud Functions v2.

## Arquitetura

- Frontend estático: HTML/CSS/JS puro (sem framework, sem build, sem npm no site)
- Backend: `functions/index.js` com endpoint `authorizePortalAccess`
- Banco: Firebase Realtime Database (registro e atualização da solicitação)

## URL oficial do portal

- Produção: `https://hbtmarc.github.io/captivegorillas`

## Pré-requisitos (uma vez)

1. Node.js 20+
2. Conta Firebase com acesso ao projeto `projectshub-marc35`

## Setup completo do backend (Functions)

### 1) Instalar dependências

```bash
cd /Users/marcelino/Documents/VSCODE/captivegorillas/functions
npm install
```

### 2) Login no Firebase (via script local)

```bash
npm run login
```

### 3) Definir variável de ambiente local da Function

Arquivo `functions/.env`:

```env
GITHUB_PAGES_ORIGIN=https://hbtmarc.github.io
```

### 4) Definir secret obrigatório (backend)

```bash
npm run secrets:set
```

Quando pedir valor do secret `INTELBRAS_SHARED_PASSWORD`, informe a senha compartilhada usada no Intelbras.

### 5) Deploy da Function

```bash
npm run deploy
```

### 6) Confirmar função publicada

```bash
npm run functions:list
```

## Configuração do frontend

Arquivo: `assets/js/firebase-config.js`

- `window.FIREBASE_CONFIG`: credenciais do projeto Firebase
- `window.PORTAL_FUNCTIONS_ENDPOINT`: URL do endpoint de produção

Valor padrão configurado:

`https://us-central1-projectshub-marc35.cloudfunctions.net/authorizePortalAccess`

Se o Firebase retornar URL `run.app`, substitua por ela no mesmo arquivo.

## Configuração no roteador Intelbras (Portal Externo)

No Intelbras, configure o portal externo para abrir:

`https://hbtmarc.github.io/captivegorillas`

O roteador deve anexar os parâmetros de captive portal (ex.: `redirect_uri`, `ts`, `user_hash`, `continue`).

## Fluxo real esperado (sem modo demo)

1. Cliente acessa SSID de clientes
2. Intelbras redireciona para `https://hbtmarc.github.io/captivegorillas?...`
3. Usuário aceita termos e toca em **Conectar à internet**
4. Front grava `captivePortalRequests/{autoId}` no RTDB
5. Front chama `authorizePortalAccess`
6. Function valida parâmetros reais
7. Function atualiza RTDB (`status`, `authorizedAt`, `approvalUrl`, `authFlow`)
8. Front redireciona imediatamente para `approvalUrl`

## Teste local (com seu cenário)

- Origens locais já permitidas no CORS da Function:
  - `http://127.0.0.1:8001`
  - `http://localhost:8001`

Suba seu servidor estático local e acesse:

`http://127.0.0.1:8001/captivegorillas`

Observação: para teste totalmente real, os parâmetros `redirect_uri`, `ts` e `user_hash` devem vir do Intelbras.

## Teste ponta a ponta em produção (celular)

1. Publicar o site no GitHub Pages
2. Deploy das Functions concluído sem erro
3. Secret `INTELBRAS_SHARED_PASSWORD` configurado
4. Intelbras apontando para `https://hbtmarc.github.io/captivegorillas`
5. No celular, conectar no SSID de clientes
6. Abrir o portal e aceitar termos
7. Tocar em **Conectar à internet**
8. Validar:
   - redirecionamento para URL de aprovação
   - internet liberada
   - registro no RTDB atualizado para `authorized`

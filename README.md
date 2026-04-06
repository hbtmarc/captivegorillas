# Captive Portal - Gorillas Hamburgueria (sem Blaze)

Site estático em GitHub Pages com backend de autorização em Vercel Serverless.

## 1) URLs oficiais

- Site: `https://hbtmarc.github.io/captivegorillas`
- Endpoint backend (após deploy Vercel): `https://SEU_PROJETO.vercel.app/api/authorizePortalAccess`

## 2) Variáveis do backend (Vercel)

Configure no projeto Vercel:

- `INTELBRAS_SHARED_PASSWORD` = senha compartilhada do seu fluxo Intelbras
- `FIREBASE_DATABASE_URL` = `https://projectshub-marc35-default-rtdb.firebaseio.com`
- `GITHUB_PAGES_ORIGIN` = `https://hbtmarc.github.io`

## 3) Deploy do backend (Vercel)

No repositório atual:

```bash
cd /Users/marcelino/Documents/VSCODE/captivegorillas
npx vercel
```

Depois do primeiro deploy:

```bash
npx vercel --prod
```

## 4) Configurar frontend para usar backend real

No arquivo `assets/js/firebase-config.js`, preencher:

```js
window.PORTAL_AUTH_ENDPOINT = "https://SEU_PROJETO.vercel.app/api/authorizePortalAccess";
```

E manter `window.FIREBASE_CONFIG` com seus dados atuais.

## 5) Configuração Intelbras (portal externo)

URL de portal externo no roteador:

`https://hbtmarc.github.io/captivegorillas`

O Intelbras deve anexar os parâmetros reais (`redirect_uri`, `ts`, `user_hash`, `continue`).

## 6) Fluxo real esperado

1. Cliente conecta no SSID de clientes
2. Intelbras abre `https://hbtmarc.github.io/captivegorillas?...`
3. Usuário aceita termos e toca em **Conectar à internet**
4. Front grava `captivePortalRequests/{autoId}` no RTDB
5. Front chama `/api/authorizePortalAccess`
6. Backend valida parâmetros e monta `approvalUrl`
7. Backend atualiza RTDB (`status`, `authorizedAt`, `approvalUrl`, `authFlow`)
8. Front redireciona para `approvalUrl`

## 7) Teste local

Frontend local permitido em CORS:

- `http://127.0.0.1:8001`
- `http://localhost:8001`

Abrir:

`http://127.0.0.1:8001/captivegorillas`

## 8) Teste de produção com celular

1. Publicar GitHub Pages e backend Vercel
2. Confirmar `PORTAL_AUTH_ENDPOINT` no `firebase-config.js`
3. Conectar celular no SSID de clientes
4. Abrir captive portal, aceitar termos e tocar em **Conectar à internet**
5. Validar:
  - redirecionamento para URL de aprovação
  - internet liberada
  - registro no RTDB com `status: authorized`

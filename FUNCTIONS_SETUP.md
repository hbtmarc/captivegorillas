# Setup Cloud Function - Captive Portal

Este projeto mantém o front-end estático (GitHub Pages) e usa Firebase Functions apenas para autorização real.

## 1) Nomes exatos de configuração

- Secret (obrigatório): `INTELBRAS_SHARED_PASSWORD`
- Variável de ambiente (obrigatória): `GITHUB_PAGES_ORIGIN`

## 2) Instalar dependências da function

```bash
cd functions
npm install
cd ..
```

## 3) Definir secret no Firebase

```bash
firebase functions:secrets:set INTELBRAS_SHARED_PASSWORD --project projectshub-marc35
```

## 4) Definir origem de produção (GitHub Pages)

Crie/edite o arquivo `functions/.env`:

```env
GITHUB_PAGES_ORIGIN=https://SEU_USUARIO.github.io
```

Se o repositório tiver nome no caminho, continue usando apenas a origem (sem sufixo), por exemplo:
`https://SEU_USUARIO.github.io`

## 5) Deploy da função

```bash
firebase deploy --only functions --project projectshub-marc35
```

A função publicada será:
- `authorizePortalAccess` (HTTP v2)

## 6) Configurar endpoint no front-end

Após o deploy, copie a URL HTTP da função e cole em:

- `assets/js/firebase-config.js` na variável `window.PORTAL_FUNCTIONS_ENDPOINT`

Exemplo:

```js
window.PORTAL_FUNCTIONS_ENDPOINT = "https://authorizeportalaccess-xxxx-uc.a.run.app";
```

## 7) Fluxo esperado

1. Front grava em `captivePortalRequests/{autoId}`
2. Front chama `authorizePortalAccess`
3. Se retornar `approvalUrl`, navegador redireciona imediatamente
4. Se `demoMode=true`, continua no fluxo de demonstração

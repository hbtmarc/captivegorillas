# Captive Portal - Gorillas Hamburgueria

Site estático (GitHub Pages) com fluxo de captive portal Intelbras.
Frontend: HTML/CSS/JS puro. Backend: Firebase Cloud Functions (HTTP v2).

## Setup rápido (Functions)

### 1) Pré-requisitos
- Firebase CLI instalado e autenticado
- Projeto Firebase: `projectshub-marc35`

### 2) Variáveis locais da Function
Crie/edite `functions/.env`:

```env
GITHUB_PAGES_ORIGIN=https://hbtmarc.github.io
```

### 3) Secret obrigatório (backend)
```bash
firebase functions:secrets:set INTELBRAS_SHARED_PASSWORD --project projectshub-marc35
```

### 4) Instalar dependências da Function
```bash
cd functions
npm install
cd ..
```

## Deploy exato das Functions

```bash
cd /Users/marcelino/Documents/VSCODE/captivegorillas
firebase deploy --only functions --project projectshub-marc35
```

Função publicada: `authorizePortalAccess`

## Configuração do frontend (estático)

Arquivo: `assets/js/firebase-config.js`

- `window.FIREBASE_CONFIG`: já preenchido
- `window.PORTAL_FUNCTIONS_ENDPOINT`: endpoint de produção da function

Padrão atual:
`https://us-central1-projectshub-marc35.cloudfunctions.net/authorizePortalAccess`

## Teste de produção

1. Publicar site no GitHub Pages em:
   `https://hbtmarc.github.io/captivegorillas`
2. Confirmar que Intelbras redireciona para esse endereço com query params do portal externo.
3. Conectar celular no SSID de clientes.
4. Abrir o captive portal e aceitar os termos.
5. Tocar em **Conectar à internet**.
6. Resultado esperado:
   - com `redirect_uri`, `ts`, `user_hash`: redirecionamento imediato para `approvalUrl` (liberação real)
   - sem parâmetros reais: fluxo segue em modo demonstração (`#/connected`)

## URL para configurar no Intelbras (pattern)

Use a URL base do portal externo:

`https://hbtmarc.github.io/captivegorillas`

O equipamento adicionará os parâmetros na query string (ex.: `redirect_uri`, `ts`, `user_hash`, `continue`).

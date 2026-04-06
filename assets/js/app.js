// ================================================
// Gorillas Hamburgueria — Captive Portal App
// Vanilla JS · Hash Router · Firebase CDN opcional
// ================================================

const CAPTIVE_KEYS = [
  'continue', 'redirect_uri', 'user_hash', 'ts',
  'ip', 'ap_mac', 'mac', 'radio', 'ssid'
];

const SESSION_MINUTES = 30;
const IDLE_MINUTES = 5;

let captiveParams = {};
let lastConnectionResult = {
  mode: 'demo',
  requestId: null,
  warning: 'Firebase não está ativo. Dados não foram gravados.'
};

let firebaseServicesPromise = null;

function parseCaptiveParams() {
  const url = new URL(window.location.href);
  const parsed = {};

  for (const key of CAPTIVE_KEYS) {
    parsed[key] = url.searchParams.get(key) || null;
  }

  captiveParams = parsed;
}

function hasCaptiveParams() {
  return CAPTIVE_KEYS.some((key) => Boolean(captiveParams[key]));
}

function hasRealFirebaseConfig() {
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg || typeof cfg !== 'object') return false;

  const required = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'appId'];
  return required.every((key) => {
    const value = cfg[key];
    return typeof value === 'string' && value.trim() !== '' && !value.includes('SUA_');
  });
}

async function getFirebaseServices() {
  if (!hasRealFirebaseConfig()) return null;

  if (!firebaseServicesPromise) {
    firebaseServicesPromise = (async () => {
      const [{ initializeApp, getApps }, { getDatabase, ref, push }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js')
      ]);

      const app = getApps().length ? getApps()[0] : initializeApp(window.FIREBASE_CONFIG);
      const db = getDatabase(app);
      return { db, ref, push };
    })();
  }

  return firebaseServicesPromise;
}

function getRoute() {
  return window.location.hash || '#/portal';
}

function navigate(hash) {
  window.location.hash = hash;
}

function router() {
  const route = getRoute();
  const app = document.getElementById('app');

  switch (route) {
    case '#/connected':
      app.innerHTML = renderConnected();
      bindConnected(app);
      break;
    case '#/portal':
    default:
      app.innerHTML = renderPortal();
      bindPortal(app);
      break;
  }
}

function renderPortal() {
  return `
    <div class="view">
      <div class="brand">
        <span class="brand-icon" aria-hidden="true">🦍</span>
        <div class="brand-name">Gorillas</div>
        <div class="brand-tag">Hamburgueria</div>
      </div>

      <div class="divider"></div>

      <h1 class="title">Bem-vindo à nossa rede Wi-Fi!</h1>
      <p class="subtitle">Conecte-se gratuitamente e aproveite sua experiência aqui no Gorillas.</p>

      <div class="card" role="region" aria-label="Informações da rede">
        <div class="card-title">Informações da Rede</div>
        <div class="info-row">
          <span class="info-label">Rede</span>
          <span class="info-value">Gorillas - CLIENTES</span>
        </div>
        <div class="info-row">
          <span class="info-label">Sessão</span>
          <span class="info-value">${SESSION_MINUTES} minutos</span>
        </div>
        <div class="info-row">
          <span class="info-label">Inatividade</span>
          <span class="info-value">${IDLE_MINUTES} minutos</span>
        </div>
      </div>

      <p class="legal">
        Ao utilizar esta rede, você concorda com as políticas de uso do estabelecimento.
        A conexão é fornecida como cortesia, sem garantias de velocidade ou disponibilidade.
        Não utilize para atividades ilegais ou que violem direitos de terceiros.
      </p>

      <div class="check-group">
        <input type="checkbox" id="terms" aria-required="true">
        <label for="terms">Li e aceito os termos de uso da rede</label>
      </div>

      <div class="validation-msg" id="val-msg" role="alert"></div>

      <button class="btn" id="btn-connect" type="button">
        Conectar à internet
      </button>
    </div>`;
}

function buildPortalRequestRecord() {
  return {
    createdAt: new Date().toISOString(),
    status: 'pending',
    portalMode: 'externo',
    authMode: 'senha',
    businessName: 'Gorillas Hamburgueria',
    sharedPasswordLabel: 'configured-on-intelbras',
    sessionMinutes: SESSION_MINUTES,
    idleMinutes: IDLE_MINUTES,
    acceptedTerms: true,
    captiveParams: { ...captiveParams },
    clientMeta: {
      userAgent: navigator.userAgent || null,
      language: navigator.language || null,
      platform: navigator.platform || null,
      screenWidth: window.screen?.width || null,
      screenHeight: window.screen?.height || null
    },
    routeOrigin: getRoute(),
    source: 'github-pages'
  };
}

async function savePortalRequest() {
  if (!hasRealFirebaseConfig()) {
    return {
      ok: false,
      mode: 'demo',
      warning: 'Firebase não está ativo. Solicitação não foi gravada no banco.'
    };
  }

  try {
    const services = await getFirebaseServices();
    if (!services) {
      return {
        ok: false,
        mode: 'demo',
        warning: 'Firebase não está ativo. Solicitação não foi gravada no banco.'
      };
    }

    const payload = buildPortalRequestRecord();
    const result = await services.push(services.ref(services.db, 'captivePortalRequests'), payload);

    return {
      ok: true,
      mode: 'firebase',
      requestId: result.key,
      warning: null
    };
  } catch (_error) {
    return {
      ok: false,
      mode: 'demo',
      warning: 'Não foi possível gravar no Firebase agora. Operando em Modo demonstração.'
    };
  }
}

function bindPortal(container) {
  const checkbox = container.querySelector('#terms');
  const btn = container.querySelector('#btn-connect');
  const valMsg = container.querySelector('#val-msg');

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      valMsg.textContent = '';
      checkbox.setAttribute('aria-invalid', 'false');
    }
  });

  btn.addEventListener('click', async () => {
    if (!checkbox.checked) {
      valMsg.textContent = 'Você precisa aceitar os termos para continuar.';
      checkbox.setAttribute('aria-invalid', 'true');
      checkbox.focus();
      return;
    }

    checkbox.setAttribute('aria-invalid', 'false');
    valMsg.textContent = '';

    btn.disabled = true;
    btn.textContent = 'Conectando...';

    lastConnectionResult = await savePortalRequest();
    navigate('#/connected');
  });
}

function renderConnected() {
  const isFirebaseMode = lastConnectionResult.mode === 'firebase' && lastConnectionResult.ok;
  const hasParams = hasCaptiveParams();
  const badgeClass = isFirebaseMode ? 'badge--ready' : 'badge--demo';
  const badgeText = isFirebaseMode ? 'Solicitação registrada com sucesso' : 'Modo demonstração';
  const subtitle = hasParams
    ? 'Portal pronto para receber integração de liberação de rede no próximo passo.'
    : 'Fluxo de demonstração ativo para testes sem parâmetros de captive portal.';

  return `
    <div class="view">
      <div class="brand">
        <span class="brand-icon" aria-hidden="true">🦍</span>
        <div class="brand-name">Gorillas</div>
        <div class="brand-tag">Hamburgueria</div>
      </div>

      <div class="divider"></div>

      <div class="mt-20 text-center">
        <div class="success-icon" aria-hidden="true">✅</div>
        <h1 class="title">Conexão autorizada!</h1>
        <p class="subtitle mt-12">${subtitle}</p>
      </div>

      <div class="mt-20 text-center">
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>

      ${isFirebaseMode && lastConnectionResult.requestId ? `
      <div class="request-id" role="status" aria-live="polite">
        ID da solicitação: <strong>${lastConnectionResult.requestId}</strong>
      </div>
      ` : ''}

      <div class="card">
        <div class="card-title">Resumo da sessão</div>
        <div class="info-row">
          <span class="info-label">Sessão</span>
          <span class="info-value">${SESSION_MINUTES} minutos</span>
        </div>
        <div class="info-row">
          <span class="info-label">Inatividade</span>
          <span class="info-value">${IDLE_MINUTES} minutos</span>
        </div>
      </div>

      ${!isFirebaseMode && lastConnectionResult.warning ? `
      <div class="warning-note" role="note">
        ${lastConnectionResult.warning}
      </div>
      ` : ''}

      <div class="tech-note">
        ⚙️ A liberação real da rede (autenticação Intelbras/RADIUS) será integrada no próximo passo.
      </div>

      <button class="btn-outline" id="btn-back" type="button">
        ← Voltar ao portal
      </button>
    </div>`;
}

function bindConnected(container) {
  container.querySelector('#btn-back').addEventListener('click', () => {
    navigate('#/portal');
  });
}

parseCaptiveParams();

if (!window.location.hash) {
  window.location.hash = '#/portal';
}

window.addEventListener('hashchange', router);
router();

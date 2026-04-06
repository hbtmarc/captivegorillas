// ================================================
// Gorillas Hamburgueria — Captive Portal App
// Vanilla JS · Hash Router · No dependencies
// ================================================

// --- Captive portal query-param keys ---
const CAPTIVE_KEYS = [
  'continue', 'redirect_uri', 'user_hash', 'ts',
  'ip', 'ap_mac', 'mac', 'radio', 'ssid'
];

// --- State ---
let captiveParams = {};   // parsed captive params (if any)
let hasRealParams = false; // true when at least one captive param exists

// ------------------------------------------------
// Parse and store captive params from the URL
// ------------------------------------------------
function parseCaptiveParams() {
  const url = new URL(window.location.href);
  captiveParams = {};

  for (const key of CAPTIVE_KEYS) {
    const val = url.searchParams.get(key);
    if (val) captiveParams[key] = val;
  }

  hasRealParams = Object.keys(captiveParams).length > 0;
}

// ------------------------------------------------
// Simple hash router
// ------------------------------------------------
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

// ------------------------------------------------
// #/portal — main landing page
// ------------------------------------------------
function renderPortal() {
  return `
    <div class="view">
      <!-- Brand -->
      <div class="brand">
        <span class="brand-icon" aria-hidden="true">🦍</span>
        <div class="brand-name">Gorillas</div>
        <div class="brand-tag">Hamburgueria</div>
      </div>

      <div class="divider"></div>

      <!-- Heading -->
      <h1 class="title">Bem-vindo à nossa rede Wi-Fi!</h1>
      <p class="subtitle">Conecte-se gratuitamente e aproveite sua experiência aqui no Gorillas.</p>

      <!-- Network info card -->
      <div class="card" role="region" aria-label="Informações da rede">
        <div class="card-title">Informações da Rede</div>
        <div class="info-row">
          <span class="info-label">Rede</span>
          <span class="info-value">Gorillas - CLIENTES</span>
        </div>
        <div class="info-row">
          <span class="info-label">Sessão</span>
          <span class="info-value">30 minutos</span>
        </div>
        <div class="info-row">
          <span class="info-label">Inatividade</span>
          <span class="info-value">5 minutos</span>
        </div>
      </div>

      <!-- Legal -->
      <p class="legal">
        Ao utilizar esta rede, você concorda com as políticas de uso do estabelecimento.
        A conexão é fornecida como cortesia, sem garantias de velocidade ou disponibilidade.
        Não utilize para atividades ilegais ou que violem direitos de terceiros.
      </p>

      <!-- Terms checkbox -->
      <div class="check-group">
        <input type="checkbox" id="terms" aria-required="true">
        <label for="terms">Li e aceito os termos de uso da rede</label>
      </div>

      <!-- Validation message -->
      <div class="validation-msg" id="val-msg" role="alert"></div>

      <!-- CTA -->
      <button class="btn" id="btn-connect" type="button">
        Conectar à internet
      </button>
    </div>`;
}

function bindPortal(container) {
  const checkbox = container.querySelector('#terms');
  const btn = container.querySelector('#btn-connect');
  const valMsg = container.querySelector('#val-msg');

  // Clear validation when user checks the box
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) valMsg.textContent = '';
  });

  btn.addEventListener('click', () => {
    if (!checkbox.checked) {
      valMsg.textContent = 'Você precisa aceitar os termos para continuar.';
      checkbox.focus();
      return;
    }
    navigate('#/connected');
  });
}

// ------------------------------------------------
// #/connected — success / post-auth page
// ------------------------------------------------
function renderConnected() {
  const mode = hasRealParams;
  const badgeClass = mode ? 'badge--ready' : 'badge--demo';
  const badgeText  = mode ? 'Portal pronto para integração' : 'Modo demonstração';

  return `
    <div class="view">
      <!-- Brand -->
      <div class="brand">
        <span class="brand-icon" aria-hidden="true">🦍</span>
        <div class="brand-name">Gorillas</div>
        <div class="brand-tag">Hamburgueria</div>
      </div>

      <div class="divider"></div>

      <!-- Success state -->
      <div class="mt-20 text-center">
        <div class="success-icon" aria-hidden="true">✅</div>
        <h1 class="title">Conexão autorizada!</h1>
        <p class="subtitle mt-12">Aproveite o Wi-Fi do Gorillas Hamburgueria.</p>
      </div>

      <!-- Mode badge -->
      <div class="mt-20 text-center">
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>

      <!-- Session summary card -->
      <div class="card">
        <div class="card-title">Resumo da sessão</div>
        <div class="info-row">
          <span class="info-label">Sessão</span>
          <span class="info-value">30 minutos</span>
        </div>
        <div class="info-row">
          <span class="info-label">Inatividade</span>
          <span class="info-value">5 minutos</span>
        </div>
        ${mode ? renderParamsRows() : ''}
      </div>

      <!-- Tech note -->
      <div class="tech-note">
        ⚙️ A integração com o backend de autenticação (Intelbras / RADIUS) ainda não
        está implementada. Este portal está preparado para receber os parâmetros de
        redirecionamento e concluir o fluxo de liberação automaticamente.
      </div>

      <!-- Back button -->
      <button class="btn-outline" id="btn-back" type="button">
        ← Voltar ao portal
      </button>
    </div>`;
}

/** Render extra info-rows for captive params when available */
function renderParamsRows() {
  const labels = {
    ssid: 'SSID', ip: 'IP do cliente', mac: 'MAC do cliente',
    ap_mac: 'MAC do AP', radio: 'Rádio', ts: 'Timestamp'
  };

  let html = '';
  for (const [key, label] of Object.entries(labels)) {
    if (captiveParams[key]) {
      html += `
        <div class="info-row">
          <span class="info-label">${label}</span>
          <span class="info-value" style="font-size:.78rem;word-break:break-all">${captiveParams[key]}</span>
        </div>`;
    }
  }
  return html;
}

function bindConnected(container) {
  container.querySelector('#btn-back').addEventListener('click', () => {
    navigate('#/portal');
  });
}

// ------------------------------------------------
// Init
// ------------------------------------------------
parseCaptiveParams();

// Default route if no hash
if (!window.location.hash) {
  window.location.hash = '#/portal';
}

window.addEventListener('hashchange', router);
router();

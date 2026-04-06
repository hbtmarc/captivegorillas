const LOCAL_ALLOWED_ORIGINS = new Set([
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:5500',
  'http://localhost:8001',
  'http://127.0.0.1',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:8001'
]);

const REQUIRED_KEYS = ['redirect_uri', 'ts', 'user_hash'];

function getAllowedOrigins() {
  const allowed = new Set(LOCAL_ALLOWED_ORIGINS);
  const prodOrigin = (process.env.GITHUB_PAGES_ORIGIN || 'https://hbtmarc.github.io').trim();
  if (prodOrigin) allowed.add(prodOrigin);
  return allowed;
}

function setCors(req, res) {
  const requestOrigin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function hasRequiredCaptiveParams(captiveParams) {
  if (!captiveParams || typeof captiveParams !== 'object') return false;

  return REQUIRED_KEYS.every((key) => {
    const value = captiveParams[key];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}

function buildApprovalUrl(captiveParams) {
  const url = new URL(String(captiveParams.redirect_uri));

  url.searchParams.set('ts', String(captiveParams.ts));
  url.searchParams.set('user_hash', String(captiveParams.user_hash));

  if (captiveParams.continue) {
    url.searchParams.set('continue', String(captiveParams.continue));
  }

  url.searchParams.set('session_timeout', '1800');
  url.searchParams.set('idle_timeout', '300');

  return url.toString();
}

async function updateRequestRecord(requestId, updates) {
  const databaseUrl = process.env.FIREBASE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('FIREBASE_DATABASE_URL não configurado.');
  }

  const base = databaseUrl.replace(/\/$/, '');
  const endpoint = `${base}/captivePortalRequests/${encodeURIComponent(requestId)}.json`;

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao atualizar RTDB (${response.status}): ${body}`);
  }
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      demoMode: false,
      approvalUrl: null,
      message: 'Método não permitido.'
    });
    return;
  }

  const requestOrigin = req.headers.origin;
  if (requestOrigin && !getAllowedOrigins().has(requestOrigin)) {
    res.status(403).json({
      success: false,
      demoMode: false,
      approvalUrl: null,
      message: 'Origem não autorizada para este endpoint.'
    });
    return;
  }

  const { requestId, acceptedTerms, captiveParams } = req.body || {};

  if (!requestId || typeof requestId !== 'string') {
    res.status(400).json({
      success: false,
      demoMode: false,
      approvalUrl: null,
      message: 'requestId é obrigatório.'
    });
    return;
  }

  if (!acceptedTerms) {
    try {
      await updateRequestRecord(requestId, {
        status: 'denied',
        authorizedAt: new Date().toISOString(),
        approvalUrl: null,
        authFlow: 'external-password'
      });
    } catch (_err) {
      // mantém resposta principal
    }

    res.status(200).json({
      success: false,
      demoMode: false,
      approvalUrl: null,
      message: 'Termos de uso não aceitos.'
    });
    return;
  }

  const sharedPassword = process.env.INTELBRAS_SHARED_PASSWORD;
  if (!sharedPassword || !sharedPassword.trim()) {
    res.status(500).json({
      success: false,
      demoMode: false,
      approvalUrl: null,
      message: 'Segredo de autorização não configurado no backend.'
    });
    return;
  }

  if (!hasRequiredCaptiveParams(captiveParams)) {
    await updateRequestRecord(requestId, {
      status: 'denied',
      authorizedAt: new Date().toISOString(),
      approvalUrl: null,
      authFlow: 'external-password'
    });

    res.status(200).json({
      success: true,
      demoMode: true,
      approvalUrl: null,
      message: 'Parâmetros reais do captive portal não recebidos'
    });
    return;
  }

  try {
    const approvalUrl = buildApprovalUrl(captiveParams);

    await updateRequestRecord(requestId, {
      status: 'authorized',
      authorizedAt: new Date().toISOString(),
      approvalUrl,
      authFlow: 'external-password'
    });

    res.status(200).json({
      success: true,
      demoMode: false,
      approvalUrl,
      message: 'Acesso autorizado. Redirecionando para liberação da rede.'
    });
  } catch (error) {
    try {
      await updateRequestRecord(requestId, {
        status: 'denied',
        authorizedAt: new Date().toISOString(),
        approvalUrl: null,
        authFlow: 'external-password'
      });
    } catch (_err) {
      // mantém resposta principal
    }

    res.status(500).json({
      success: false,
      demoMode: false,
      approvalUrl: null,
      message: error?.message || 'Falha no processamento da autorização.'
    });
  }
};

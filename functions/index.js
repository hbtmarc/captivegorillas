const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

initializeApp();

const intelbrasSharedPassword = defineSecret('INTELBRAS_SHARED_PASSWORD');
const githubPagesOrigin = defineString('GITHUB_PAGES_ORIGIN');

const LOCAL_ALLOWED_ORIGINS = new Set([
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:8001',
  'http://localhost:5500',
  'http://127.0.0.1',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:8001',
  'http://127.0.0.1:5500'
]);

const DEFAULT_PRODUCTION_ORIGIN = 'https://hbtmarc.github.io';

function getAllowedOrigins() {
  const allowed = new Set(LOCAL_ALLOWED_ORIGINS);
  const prodOrigin = githubPagesOrigin.value();
  const originFromEnv = typeof prodOrigin === 'string' ? prodOrigin.trim() : '';
  if (originFromEnv) {
    allowed.add(originFromEnv);
  } else {
    allowed.add(DEFAULT_PRODUCTION_ORIGIN);
  }
  return allowed;
}

function setCorsHeaders(req, res) {
  const requestOrigin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    res.set('Access-Control-Allow-Origin', requestOrigin);
    res.set('Vary', 'Origin');
  }

  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

function buildApprovalUrl(captiveParams) {
  const redirectUri = captiveParams.redirect_uri;
  const url = new URL(redirectUri);

  url.searchParams.set('ts', String(captiveParams.ts));
  url.searchParams.set('user_hash', String(captiveParams.user_hash));

  if (captiveParams.continue) {
    url.searchParams.set('continue', String(captiveParams.continue));
  }

  url.searchParams.set('session_timeout', '1800');
  url.searchParams.set('idle_timeout', '300');

  return url.toString();
}

function hasRequiredCaptiveParams(captiveParams) {
  if (!captiveParams || typeof captiveParams !== 'object') return false;

  const required = ['redirect_uri', 'ts', 'user_hash'];
  return required.every((key) => {
    const value = captiveParams[key];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}

exports.authorizePortalAccess = onRequest(
  {
    region: 'us-central1',
    secrets: [intelbrasSharedPassword]
  },
  async (req, res) => {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        demoMode: true,
        approvalUrl: null,
        message: 'Método não permitido.'
      });
      return;
    }

    const requestOrigin = req.headers.origin;
    if (requestOrigin && !getAllowedOrigins().has(requestOrigin)) {
      res.status(403).json({
        success: false,
        demoMode: true,
        approvalUrl: null,
        message: 'Origem não autorizada para este endpoint.'
      });
      return;
    }

    const { requestId, acceptedTerms, captiveParams } = req.body || {};

    if (!requestId || typeof requestId !== 'string') {
      res.status(400).json({
        success: false,
        demoMode: true,
        approvalUrl: null,
        message: 'requestId é obrigatório.'
      });
      return;
    }

    const db = getDatabase();
    const requestRef = db.ref(`captivePortalRequests/${requestId}`);

    if (!acceptedTerms) {
      await requestRef.update({
        status: 'denied',
        authorizedAt: new Date().toISOString(),
        approvalUrl: null,
        authFlow: 'external-password'
      });

      res.status(200).json({
        success: false,
        demoMode: false,
        approvalUrl: null,
        message: 'Termos de uso não aceitos.'
      });
      return;
    }

    const sharedPassword = intelbrasSharedPassword.value();
    if (!sharedPassword || String(sharedPassword).trim() === '') {
      logger.error('INTELBRAS_SHARED_PASSWORD não configurado.');

      await requestRef.update({
        status: 'denied',
        authorizedAt: new Date().toISOString(),
        approvalUrl: null,
        authFlow: 'external-password'
      });

      res.status(200).json({
        success: false,
        demoMode: true,
        approvalUrl: null,
        message: 'Integração de autorização ainda não está ativa.'
      });
      return;
    }

    if (!hasRequiredCaptiveParams(captiveParams)) {
      await requestRef.update({
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

      await requestRef.update({
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
      logger.error('Falha ao autorizar acesso captive portal', error);

      await requestRef.update({
        status: 'denied',
        authorizedAt: new Date().toISOString(),
        approvalUrl: null,
        authFlow: 'external-password'
      });

      res.status(500).json({
        success: false,
        demoMode: true,
        approvalUrl: null,
        message: 'Falha no processamento da autorização.'
      });
    }
  }
);

/*
  Copie este arquivo para firebase-config.js e preencha com seus dados do Firebase.
  Em produção estática (GitHub Pages), mantenha firebase-config.js fora do controle de versão
  se quiser proteger o projeto de alterações acidentais.
*/

window.FIREBASE_CONFIG = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx"
};

// URL HTTP da Cloud Function authorizePortalAccess (v2)
// Exemplo: https://authorizeportalaccess-xxxx-uc.a.run.app
window.PORTAL_FUNCTIONS_ENDPOINT = "";

// Endpoint recomendado sem Blaze (Vercel Serverless)
// Exemplo: https://seu-projeto.vercel.app/api/authorizePortalAccess
window.PORTAL_AUTH_ENDPOINT = "";

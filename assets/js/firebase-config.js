/*
  Configuração Firebase ativa para o portal estático.
*/
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAuZ_RWLLn26CqUy3zpyz75_IuQSVQti2k",
  authDomain: "projectshub-marc35.firebaseapp.com",
  databaseURL: "https://projectshub-marc35-default-rtdb.firebaseio.com",
  projectId: "projectshub-marc35",
  storageBucket: "projectshub-marc35.firebasestorage.app",
  messagingSenderId: "949883815683",
  appId: "1:949883815683:web:889f3ae1c357d9d0b34b36",
  measurementId: "G-J0VS6K3V2P"
};

// Endpoint do backend serverless (Vercel) para autorização real.
// Exemplo: https://SEU_PROJETO.vercel.app/api/authorizePortalAccess
window.PORTAL_AUTH_ENDPOINT = "https://captivegorillas.vercel.app/api/authorizePortalAccess";

// Compatibilidade com fluxo antigo Firebase Functions (opcional).
window.PORTAL_FUNCTIONS_ENDPOINT = "";

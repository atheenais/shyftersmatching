// Initialisation du client Supabase (partagée entre toutes les pages)
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// Retourne la session active, ou null
async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

// Redirige vers index.html si pas connecté — à appeler en haut de chaque page protégée
async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

// Déconnexion
async function signOut() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

// Supabase — à remplir avec tes valeurs (Project Settings → API)
// La clé anon est conçue pour être dans le code : la sécurité vient du login + RLS.
// Ne jamais mettre la clé service_role ici.

const SUPABASE_URL  = 'https://zhudtmftodbaandntevn.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodWR0bWZ0b2RiYWFuZG50ZXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDU1MzMsImV4cCI6MjA5Njc4MTUzM30.ea8nQ27yiWp6jv3PLa03JgVzlIxP-0ppxQq9cnWPqZo';

// ⚠️ CACHE — bumper avant chaque déploiement (ex. v2 → v3).
// Ce numéro DOIT correspondre au ?v=X dans les balises <link> et <script> de chaque page HTML.
const APP_VERSION = 'v2';

// Source de vérité unique pour les rôles CODIR — ne pas dupliquer dans les autres fichiers.
const ROLES_VALIDES = [
  'Directeur Général',
  'Directeur Marketing Digital',
  'Directeur Commercial',
  'Directeur Value Chain',
  'Directeur Finance et Juridique',
  'Directeur Ressources Humaines',
  "Directeur Systèmes d'Information",
];

# CLAUDE.md — Shyfters Matching

Guide pour travailler sur ce dépôt avec Claude Code. Pour la présentation produit
complète, voir `README.md` ; ce fichier se concentre sur ce qu'il faut savoir pour
modifier le code sans rien casser.

## Ce qu'est le projet

Outil interne de consultation des rapports de matching de profils cadres dirigeants
(méthode « CODIR as a Service »). Les CV sont analysés ailleurs (projet Cowork +
skill `cv-matching`), qui pousse un JSON dans `reports/`. Cette app sert à importer
ces JSON dans une base, les consulter, les filtrer et les exporter.

## Stack & contraintes

- **Front** : HTML/CSS/JavaScript **vanilla**. Aucun framework, aucun build, aucun npm.
  Ne pas introduire de bundler ni de dépendance npm — tout est servi en statique.
- **Seule lib externe** : `@supabase/supabase-js@2` via CDN jsDelivr, incluse dans
  chaque page.
- **Backend** : Supabase (Auth email/mot de passe + PostgreSQL + Row Level Security).
- **Hébergement** : GitHub Pages — `https://atheenais.github.io/shyftersmatching`.
  Tout commit sur `main` est déployé tel quel ; il n'y a pas d'étape de build.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `index.html` | Écran de connexion |
| `list.html` | Liste des rapports : recherche fuzzy, filtres, tri, **Sync GitHub**, export CSV |
| `new.html` | Formulaire création/édition (import JSON, slider de score, auto-verdict) |
| `rapport.html` | Détail d'un rapport + rendu de la matching card + export PDF (`window.print()`) + suppression |
| `stats.html` | Tableau de bord (KPIs, répartition, filtre période) |
| `config.js` | `SUPABASE_URL`, `SUPABASE_ANON`, `APP_VERSION` |
| `auth.js` | Session Supabase : `getSession`, `requireAuth`, `signOut`, redirection si expiration |
| `styles.css` | Thème dark, slider, toasts, responsive, styles d'impression |
| `reports/` | JSON déposés par le skill `cv-matching`. Les fichiers préfixés `_` (ex. `_archived.json`) sont techniques, pas des rapports |

Chaque page protégée commence par `await requireAuth()` puis instancie le client
Supabase partagé `sb` (défini dans `auth.js`).

## Base de données — table `rapports`

Colonnes utilisées par le front : `id`, `candidat_nom`, `poste_actuel`, `poste_vise`
(un des 7 rôles CODIR), `client`, `score_global` (0–100), `recommandation`
(`fort` | `partiel` | `non-match`), `synthese`, `analysis_filename` (nom du fichier
JSON GitHub d'origine), `detail_grille` (objet JSON complet de la matching card),
`auteur_id`, `created_at`, `updated_at`. La table `profiles(nom)` est jointe pour
afficher l'auteur.

`analysis_filename` est la clé de rapprochement avec les fichiers de `reports/` :
c'est ce qui permet de savoir ce qui a déjà été importé.

## Règles à respecter

1. **Cache busting.** `config.js` définit `APP_VERSION`. Les `<link>`/`<script>` des
   pages portent un `?v=N`. Si tu modifies `styles.css`, `config.js` ou `auth.js`,
   incrémente le `?v=` correspondant sur toutes les pages **et** `APP_VERSION`.
   Une modification du seul script inline d'une page HTML ne nécessite pas de bump.

2. **Pas d'état applicatif dans `localStorage`.** Le `localStorage` est propre à chaque
   appareil et ne se synchronise pas — il provoquait l'affichage répété de rapports
   déjà importés sur un nouveau device. Tout état qui doit être cohérent entre
   appareils (ex. « déjà importé ») se déduit de Supabase. Le suivi des imports passe
   par une requête sur `analysis_filename` (`getImportedFromDB()` dans `list.html`),
   pas par du stockage navigateur.

3. **Sécurité Supabase.** La clé `anon` dans `config.js` est normale (sécurité assurée
   par le login + RLS). Ne **jamais** committer la clé `service_role`. Ne pas désactiver
   RLS. L'inscription publique est volontairement désactivée (comptes créés dans le
   dashboard Supabase).

4. **Données sensibles.** Ce sont des CV de dirigeants. Pas de logs de données
   personnelles, pas d'export non authentifié.

## Flux d'import (Sync GitHub)

1. `list.html` liste `reports/` via l'API GitHub publique (`fetch`, lecture seule).
2. Il récupère les `analysis_filename` déjà en base et exclut les fichiers
   correspondants (+ ceux préfixés `_`).
3. L'utilisateur clique « Importer » → insertion dans `rapports` (avec
   `analysis_filename = nom du fichier`).
4. Au prochain sync, sur n'importe quel appareil, le fichier est exclu car présent
   en base.

## Développement local

```bash
python3 -m http.server 8765 --directory .
# http://localhost:8765/index.html
```

(`.claude/launch.json` configure ce serveur de dev.)

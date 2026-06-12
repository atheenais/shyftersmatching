# Shyfters Matching

Outil interne pour stocker, consulter et analyser les rapports de matching de profils cadres dirigeants (méthode **CODIR as a Service**).

Les profils sont analysés dans Claude (projet Cowork + skill `cv-matching`). Cet outil centralise les rapports, les rend consultables par toute l'équipe et fournit un tableau de bord d'activité.

---

## Stack

- **Interface** : HTML / CSS / JavaScript vanilla (aucun framework, aucun npm)
- **Backend** : [Supabase](https://supabase.com) — Auth email/mdp + PostgreSQL + Row Level Security
- **Hébergement** : GitHub Pages — `https://atheenais.github.io/shyftersmatching`
- **Analyse CV** : Claude (Cowork) + skill `cv-matching` + GitHub MCP → push JSON dans `reports/`

---

## Structure des fichiers

```
shyftersmatching/
├── index.html      # Écran de connexion
├── list.html       # Liste des rapports (recherche, filtres, tri, sync GitHub, export CSV)
├── new.html        # Formulaire nouveau rapport / édition (import JSON, slider score)
├── rapport.html    # Détail d'un rapport + export PDF + suppression
├── stats.html      # Tableau de bord (KPIs, barres, filtre par période)
├── config.js       # URL projet Supabase + clé anon (⚠️ jamais la clé service_role)
├── auth.js         # Session (getSession, requireAuth, signOut, intercepteur expiration)
├── styles.css      # Thème dark complet + slider + toasts + responsive mobile
├── logo.png        # Logo Shyfters blanc sur fond transparent
├── reports/        # Dépôt des JSON générés par le skill cv-matching (sync GitHub)
└── .claude/
    └── launch.json # Serveur de dev local (python3, port 8765)
```

---

## Démarrage en local

```bash
python3 -m http.server 8765 --directory .
# Ouvrir http://localhost:8765/index.html
```

---

## Fonctionnalités

### Liste des rapports (`list.html`)
- Recherche **insensible aux accents** et tolérante aux **fautes de frappe** (algorithme de Levenshtein)
- Filtres : verdict (Fort / Partiel / Non-match), rôle CODIR, recherche texte libre
- Tri par n'importe quelle colonne (nom, poste, score, recommandation, date, auteur)
- **Export CSV** (tous les rapports chargés, format UTF-8 compatible Excel)
- **Sync GitHub** : importe automatiquement les JSON déposés dans `reports/` par le skill Claude

### Formulaire rapport (`new.html`)
- **Slider de score** 0–100 avec badge coloré en live (vert / orange / rouge) et auto-sélection du verdict
- Import JSON Claude par collage ou upload de fichier `.json` → pré-remplissage automatique
- Mode **édition** (détection `?id=`) avec vérification d'appartenance
- Bouton « Enregistrer » **sticky en bas** sur mobile

### Détail rapport (`rapport.html`)
- Affichage complet de la grille de matching (critères éliminatoires, critères rôle, points forts, gaps)
- **Export PDF** via `window.print()` avec CSS d'impression dédié
- Suppression avec confirmation (auteur uniquement)

### Tableau de bord (`stats.html`)
- KPIs : total rapports, score moyen, % fort match
- Barres de répartition par verdict et par rôle CODIR
- **Filtre par période** : 7 jours / 30 jours / Tout (sans rechargement Supabase)
- Tableau des 5 derniers rapports cliquables

### Flux complet (analyse → rapport)
1. Analyser un CV dans Claude (projet Cowork, skill `cv-matching`)
2. Le skill génère un objet JSON structuré et le pousse dans `reports/` via GitHub MCP
3. Dans l'outil, cliquer **↓ Sync GitHub** pour voir les nouveaux fichiers
4. Cliquer **Importer** sur un fichier → insertion Supabase automatique
5. Le rapport apparaît immédiatement dans la liste

---

## Sécurité

- **RLS activé** : aucune donnée accessible sans authentification
- **Inscription publique désactivée** : comptes créés manuellement dans le Dashboard Supabase
- **Clé `anon` dans le code** : prévu par Supabase — la sécurité repose sur le login + les règles RLS
- **Clé `service_role`** : ne doit jamais figurer dans ce dépôt
- **Session expirée** : redirection automatique vers le login si le token est révoqué en cours de navigation
- **Données personnelles** : CV de dirigeants — projet Supabase hébergé en région UE

---

## Avancement

| Fonctionnalité | État |
|----------------|------|
| Auth email/mdp, RLS, tables `profiles` + `rapports` | ✅ |
| Liste des rapports avec recherche, filtres, tri | ✅ |
| Formulaire nouveau rapport + import JSON Claude | ✅ |
| Détail rapport + export PDF | ✅ |
| Édition et suppression (auteur uniquement) | ✅ |
| Slider de score + auto-verdict | ✅ |
| Recherche fuzzy (accents + fautes de frappe) | ✅ |
| Sync GitHub (JSON → Supabase via bouton) | ✅ |
| Export CSV | ✅ |
| Toasts de confirmation | ✅ |
| Tableau de bord avec filtre période | ✅ |
| Intercepteur session expirée | ✅ |
| Responsive mobile complet | ✅ |

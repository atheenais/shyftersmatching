# Shyfters Matching

Outil interne pour stocker et consulter les rapports de matching de profils cadres dirigeants (méthode **CODIR as a Service**).

L'analyse des profils est produite dans Claude. Cet outil sert uniquement à **ranger et relire** les rapports.

---

## Stack

- **Interface** : HTML / CSS / JavaScript vanilla (aucun framework)
- **Backend** : [Supabase](https://supabase.com) — Auth email/mdp + PostgreSQL + Row Level Security
- **Hébergement** : GitHub Pages (app statique, appels Supabase côté navigateur)

---

## Structure des fichiers

```
shyftersmatching/
├── index.html      # Écran de connexion
├── list.html       # Liste des rapports
├── config.js       # URL projet Supabase + clé anon (⚠️ jamais la clé service_role)
├── auth.js         # Gestion session (getSession, requireAuth, signOut)
├── styles.css      # Thème dark complet
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

## Sécurité

- **RLS activé** : aucune donnée accessible sans authentification.
- **Inscription publique désactivée** : les comptes sont créés manuellement dans Supabase Dashboard.
- **Clé `anon` dans le code** : c'est normal et prévu — la sécurité repose sur le login + les règles RLS, pas sur le secret de cette clé.
- **Clé `service_role`** : ne doit jamais figurer dans ce dépôt.
- **Données personnelles** : CV de dirigeants — projet Supabase hébergé en région UE.

---

## Avancement

| Lot | Contenu | État |
|-----|---------|------|
| 0 | Projet Supabase, tables `profiles` + `rapports`, RLS | ✅ |
| 1 | Login + liste des rapports (squelette) | ✅ |
| 2 | Formulaire « Nouveau rapport » + enregistrement | ✅ |
| 3 | Détail d'un rapport + recherche / filtres | ✅ |
| 4 | Collage du bloc JSON produit par Claude | 🔜 |
| 5 | Édition / suppression, rôle admin, export | 🔜 |

---

## Usage (flux complet, lot 4+)

1. Analyser un CV dans Claude avec la grille Shyfters
2. Claude produit un objet `data` JSON structuré
3. Coller ce bloc dans l'écran « Nouveau rapport »
4. Relire, ajuster, enregistrer
5. Le rapport est visible par toute l'équipe connectée

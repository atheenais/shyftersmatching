import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY     = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL           = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGINS = [
  "https://atheenais.github.io",
  "http://localhost:8765",
];

function corsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin":  allowed,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonRes(body: unknown, status = 200, origin = "") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "content-type": "application/json" },
  });
}

// ── Prompt de matching CODIR Shyfters (protocole officiel v80526) ─────────────

function buildPrompt(cv_text: string, poste_vise: string | null, client_name: string | null, today: string): string {
  const roleSection = poste_vise
    ? `Le rôle cible est : **${poste_vise}**`
    : `Détermine le rôle CODIR le plus adapté parmi les 7 rôles Shyfters listés ci-dessous.`;

  return `Tu es un consultant senior Shyfters ("Make the Shift"), cabinet de conseil stratégique & transformation.
Positionnement : "des dirigeants expérimentés, pas des consultants" — vision pragmatique fondée sur l'expérience terrain.
Modèle de service : "CODIR as a Service" — 7 rôles de direction à matcher.

⚠️ IMPORTANT : tu travailles uniquement sur le texte du CV fourni. Aucune recherche web n'est disponible dans ce contexte.
Mentionne explicitement dans recommendationDetail si des informations clés (KPIs, périmètres) sont absentes du CV et nécessiteraient une vérification.

${roleSection}
${client_name ? `Client : ${client_name}` : ""}
Date d'analyse : ${today}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROTOCOLE SHYFTERS — SCORING OFFICIEL (version 80526, mai 2026)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CRITÈRES ÉLIMINATOIRES (communs aux 7 rôles)

E1 — Position de direction (CODIR/COMEX, DG, direction de BU) démontrée — pas un profil consultant junior/théorique.
E2 — Minimum ~10 ans d'expérience dont une part significative en responsabilité de direction.
E3 — Capacité d'intervention en management de transition / mandat social.
E4 — ORIENTATION BUSINESS démontrée : les expériences passées doivent intégrer des notions de résultats et de performance d'entreprise (impact chiffré ou qualifié sur CA, marge, EBITDA, trésorerie, parts de marché, rentabilité, productivité…). Un CV purement descriptif des missions/responsabilités, sans lien explicite avec la performance, est éliminé — quel que soit le niveau hiérarchique atteint.

## CRITÈRES SPÉCIFIQUES PAR RÔLE
Pour chaque rôle, les 4 labels `roleCriteria` à utiliser sont fixés ci-dessous (≤ 30 caractères chacun).
La `note` doit rester courte (≤ 40 caractères) : preuve chiffrée tirée du CV, ou "Non mentionné", "À objectiver", "Absent du CV".

1. Directeur Général — roleLabel: "DG"
   label[0]: "DG d'entité ≥ 20 M€"          → CA de l'entité dirigée
   label[1]: "Responsabilité P&L complet"     → P&L démontré ou non
   label[2]: "≥1 cycle de transformation"     → retournement / scale / M&A
   label[3]: "KPIs EBITDA / FCF / valo"       → KPIs financiers chiffrés

2. Directeur Marketing Digital — roleLabel: "DMD"
   label[0]: "Direction mktg digital ≥ 5 ans" → durée en responsabilité marketing
   label[1]: "Budget mktg ≥ 1 M€"             → budget géré chiffré
   label[2]: "Acquisition / CRM / data"        → canaux maîtrisés
   label[3]: "KPIs CAC / LTV / ROAS"           → KPIs performance présents

3. Directeur Commercial — roleLabel: "DCOM"
   label[0]: "CA géré ≥ 10 M€"               → CA ou réseau piloté
   label[1]: "Management équipe ≥ 20 pers"    → taille équipe commerciale
   label[2]: "Négociation grands comptes"      → comptes clés / partenaires
   label[3]: "KPIs CA / marge / CA/m²"        → KPIs performance présents

4. Directeur Value Chain — roleLabel: "DVC"
   label[0]: "Direction SC / opérations"       → périmètre supply chain
   label[1]: "S&OP / achats / logistique"      → domaines couverts
   label[2]: "Transfo opérationnelle"           → lean / ERP / scale documenté
   label[3]: "KPIs OTD / BFR / coûts"          → KPIs opérationnels présents

5. Directeur Finance et Juridique — roleLabel: "DFJ"
   label[0]: "DAF/CFO entité ≥ 20 M€"         → périmètre financier
   label[1]: "Restructuring / levée fonds"     → opérations financières
   label[2]: "Cash 13 sem. / covenants"        → pilotage trésorerie
   label[3]: "KPIs EBITDA / FCF / BFR"         → KPIs financiers présents

6. Directeur Ressources Humaines — roleLabel: "DRH"
   label[0]: "DRH d'entité ≥ 200 pers"        → périmètre RH
   label[1]: "Masse salariale / GPEC / CSE"    → domaines RH couverts
   label[2]: "Transfo RH (PSE, M&A, scale)"   → transformation documentée
   label[3]: "KPIs MS/CA, turnover, eNPS"      → KPIs RH présents

7. Directeur Systèmes d'Information — roleLabel: "DSI"
   label[0]: "DSI/CTO entité ≥ 20 M€"         → périmètre SI
   label[1]: "ERP / e-com / OMS / data"        → domaines SI couverts
   label[2]: "Cas d'usage IA déployés"         → IA opérationnelle (différenciateur)
   label[3]: "KPIs dispo / ROI / TTM"          → KPIs SI présents

## USE CASES SHYFTERS (cocher uniquement ceux documentés dans le CV)

UC1 — Retournement : restructuring, procédures collectives, négociation créanciers, plan EBITDA, cash 13 semaines, PSE
UC2 — Scale : hypercroissance, industrialisation, ouverture de sites, structuration post-pilote
UC3 — Build-up/M&A : thèse d'investissement, due diligence, intégration post-fusion, LBO, fonds PE
UC4 — DNVB/omnicanal : DTC, e-commerce natif, ouverture retail, C&C, ship-from-store, CA/m²
UC5 — Implantation France : entrée de marque étrangère, set-up filiale, go-to-market, distribution
UC6 — Board/DG : gouvernance, CA, sparring partner actionnaire, comités

## RÈGLE DE SCORING OFFICIELLE

- Match fort (≥ 70) : 4 éliminatoires validés ET ≥ 4 critères spécifiques du rôle validés ET KPIs chiffrés présents dans ≥ 3 expériences ET ≥ 1 use case clairement couvert.
- Match partiel (40–69) : 3 éliminatoires validés + 2-3 critères spécifiques + au moins 1 use case pointable. À revérifier en entretien.
- Non-match (0–39) : < 3 éliminatoires OU < 2 critères spécifiques OU aucun use case identifiable.

Si E4 est invalide → verdict non-match sauf mention explicite d'une exception dûment justifiée.
Si aucun use case ne peut être pointé sérieusement → signal faible, re-questionner E1/E4.

## CRITÈRES FORTS (pondération élevée dans le score)
- Expérience retail / e-commerce / phygital / DNVB
- Track record chiffré précis et régulier
- Appétence IA / data-driven (différenciateur transversal Shyfters)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CV À ANALYSER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cv_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT DE SORTIE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Réponds UNIQUEMENT avec un bloc JSON valide, sans texte avant ni après.
Dans recommendationDetail, signale explicitement si des informations essentielles (KPIs, périmètres) sont absentes du CV et nécessiteraient une vérification ou un entretien.

\`\`\`json
{
  "name": "Prénom NOM",
  "initials": "PN",
  "title": "Titre actuel court — contexte",
  "employer": "Entreprise actuelle · depuis AAAA",
  "experience": "~X ans d'expérience",
  "analysisDate": "${today}",
  "score": 75,
  "verdict": "fort",
  "role": "Directeur Général",
  "useCases": [
    { "label": "UC1 — Retournement",        "active": false },
    { "label": "UC2 — Scale",               "active": false },
    { "label": "UC3 — Build-up/M&A",        "active": false },
    { "label": "UC4 — DNVB/omnicanal",      "active": false },
    { "label": "UC5 — Implantation France", "active": false },
    { "label": "UC6 — Board/DG",            "active": false }
  ],
  "eliminatoires": [
    { "status": "valid",   "title": "E1 — Position CODIR",           "proof": "preuve tirée du CV" },
    { "status": "valid",   "title": "E2 — Expérience 10 ans+",       "proof": "durée et contexte" },
    { "status": "partial", "title": "E3 — Management de transition", "proof": "explication nuancée" },
    { "status": "invalid", "title": "E4 — Orientation business",     "proof": "ce qui manque" }
  ],
  "roleLabel": "DG",
  "roleCriteria": [
    { "status": "valid",   "label": "critère spécifique 1 du rôle", "note": "preuve tirée du CV" },
    { "status": "partial", "label": "critère spécifique 2 du rôle", "note": "présent / manquant" },
    { "status": "invalid", "label": "critère spécifique 3 du rôle", "note": "absent ou insuffisant" },
    { "status": "valid",   "label": "critère spécifique 4 du rôle", "note": "preuve" }
  ],
  "strengths": [
    "Point fort 1 — concret, chiffré si possible",
    "Point fort 2",
    "Point fort 3"
  ],
  "gaps": [
    "Gap 1 — factuel, ancré dans les critères Shyfters",
    "Gap 2"
  ],
  "recommendation": "Entretien immédiat / Demande de compléments / Rejet",
  "recommendationDetail": "Synthèse 2-3 phrases : décision, prochaines étapes, et signalement explicite de tout KPI ou périmètre absent du CV qui nécessiterait vérification en entretien."
}
\`\`\`

Règles impératives :
- status : "valid" | "partial" | "invalid" uniquement
- verdict : "fort" | "partiel" | "non-match" uniquement
- score : entier entre 0 et 100
- Sois factuel et ancré dans le CV, pas dans des généralités
- Si E4 est "invalid", le verdict doit être "non-match" sauf mention explicite d'une exception
`;
}

// ── Handler principal ─────────────────────────────────────────────────────────

serve(async (req) => {
  const origin = req.headers.get("Origin") || "";

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return jsonRes({ error: "Méthode non autorisée" }, 405, origin);
  }

  // ── Authentification ──
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonRes({ error: "Non authentifié" }, 401, origin);
  }
  const token = authHeader.slice(7);
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
  if (authErr || !user) {
    return jsonRes({ error: "Session invalide ou expirée" }, 401, origin);
  }

  // ── Parsing du body ──
  let body: { cv_text?: string; poste_vise?: string; client_name?: string };
  try {
    body = await req.json();
  } catch {
    return jsonRes({ error: "Corps JSON invalide" }, 400, origin);
  }

  const cv_text    = (body.cv_text || "").trim();
  const poste_vise = (body.poste_vise || "").trim() || null;
  const client_name = (body.client_name || "").trim() || null;

  if (!cv_text) {
    return jsonRes({ error: "cv_text est requis" }, 400, origin);
  }

  // ── Appel Claude API ──
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  let analysis: Record<string, unknown>;
  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":         ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 4096,
        messages:   [{ role: "user", content: buildPrompt(cv_text, poste_vise, client_name, today) }],
      }),
    });

    if (!claudeRes.ok) {
      const txt = await claudeRes.text();
      throw new Error(`Claude ${claudeRes.status}: ${txt}`);
    }

    const claudeData = await claudeRes.json();
    if (!Array.isArray(claudeData.content) || claudeData.content.length === 0) {
      throw new Error("Réponse Claude vide ou format inattendu");
    }
    const rawText: string = claudeData.content[0].text ?? "";

    const match =
      rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
      rawText.match(/(\{[\s\S]*\})(?=[^}]*$)/);
    if (!match) throw new Error("Aucun JSON dans la réponse Claude");

    analysis = JSON.parse(match[1]);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonRes({ error: `Erreur analyse : ${msg}` }, 500, origin);
  }

  // ── Génération du nom de fichier ──
  const slug = String(analysis.name || "candidat")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `matching_${slug}_${dateStr}.json`;

  // ── Insertion dans Supabase ──
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: inserted, error: insertErr } = await serviceClient
    .from("rapports")
    .insert({
      candidat_nom:      String(analysis.name || ""),
      poste_actuel:      String(analysis.title || ""),
      poste_vise:        String(analysis.role || ""),
      client:            client_name,
      score_global:      typeof analysis.score === "number" ? analysis.score : null,
      recommandation:    String(analysis.verdict || "non-match"),
      synthese:          String(analysis.recommendationDetail || ""),
      detail_grille:     { ...analysis, analysisFilename: filename },
      analysis_filename: filename,
      auteur_id:         user.id,
    })
    .select("*, profiles(nom)")
    .single();

  if (insertErr) {
    return jsonRes({ error: `Erreur insertion : ${insertErr.message}` }, 500, origin);
  }

  return jsonRes(inserted, 200, origin);
});

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

// ── Prompt de matching CODIR Shyfters ─────────────────────────────────────────

function buildPrompt(cv_text: string, poste_vise: string | null, client_name: string | null, today: string): string {
  const roleSection = poste_vise
    ? `Le rôle cible est : **${poste_vise}**`
    : `Détermine le rôle CODIR le plus adapté parmi : Directeur Général, Directeur Marketing Digital, Directeur Commercial, Directeur Value Chain, Directeur Finance et Juridique, Directeur Ressources Humaines, Directeur Systèmes d'Information`;

  return `Tu es un consultant senior Shyfters spécialisé dans l'évaluation de cadres dirigeants selon la méthode CODIR as a Service.

${roleSection}
${client_name ? `Client : ${client_name}` : ""}
Date d'analyse : ${today}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MÉTHODOLOGIE SHYFTERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITÈRES ÉLIMINATOIRES (les 4 sont requis, 1 invalid = non-match sauf justification précise) :
E1 — Position CODIR : membre confirmé de comité de direction (titre DG, DAF, DRH, DSI, DCOM, DMD, DVC ou mandat social équivalent)
E2 — Expérience 10 ans+ : au moins 10 ans d'expérience professionnelle, majorité en responsabilité de direction
E3 — Management de transition : capable d'intervention en mission (intérim dirigeant, prestation de direction, management de transition)
E4 — Orientation business : au moins 1 KPI business chiffré (CA, EBITDA, effectifs, masse salariale, budget, OTD…) — absence totale de KPIs = éliminatoire direct

CRITÈRES SPÉCIFIQUES PAR RÔLE :
• Directeur Général : DG/PDG entité ≥ 20 M€ | P&L complet | ≥ 1 cycle de transformation | KPIs EBITDA/FCF/valorisation
• Directeur Marketing Digital : Direction marketing digital ≥ 5 ans | Budget ≥ 1 M€ | Maîtrise acquisition/CRM/data/e-commerce | KPIs CAC/LTV/ROAS/NPS digital
• Directeur Commercial : CA géré ≥ 10 M€ | Management équipe ≥ 5 pers | Négociation grands comptes/partenariats | KPIs CA signé/NRR/taux de conversion
• Directeur Value Chain : Direction supply chain/opérations/achats | Transformation opérationnelle lean/ERP/flux | Négociation fournisseurs | KPIs OTD/fill rate/coûts opérationnels
• Directeur Finance et Juridique : DAF/CFO périmètre ≥ 20 M€ | Comptabilité/contrôle gestion/trésorerie | Expérience levée fonds/M&A/audit | KPIs EBITDA/DSO/BFR/dette nette
• Directeur Ressources Humaines : DRH entité ≥ 200 personnes | Masse salariale/GPEC/CSE | Transformation RH (PSE/M&A/scale) | KPIs MS/CA, turnover, eNPS
• Directeur Systèmes d'Information : DSI/CTO périmètre ≥ 20 pers IT | Transformation digitale/ERP/refonte SI | Budget IT ≥ 500 K€ | KPIs disponibilité/dette technique/time-to-market

USE CASES SHYFTERS (cocher uniquement ceux documentés dans le CV) :
UC1 — Retournement : restructuring, sauvegarde d'activité, gestion de crise
UC2 — Scale : hypercroissance, scale-up, expansion rapide
UC3 — Build-up/M&A : acquisitions, fusions, intégration post-acquisition
UC4 — DNVB/omnicanal : digital, e-commerce, retail, transformation digitale
UC5 — Implantation France : développement territorial, go-to-market, réseau
UC6 — Board/DG : gouvernance, actionnariat, board, mandat social

BARÈME :
≥ 70 → fort | 40–69 → partiel | 0–39 → non-match

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CV À ANALYSER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cv_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Réponds UNIQUEMENT avec un bloc JSON valide, sans texte avant ni après :

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
    { "status": "valid",   "label": "critère 1", "note": "preuve tirée du CV" },
    { "status": "partial", "label": "critère 2", "note": "présent / manquant" },
    { "status": "invalid", "label": "critère 3", "note": "absent ou insuffisant" },
    { "status": "valid",   "label": "critère 4", "note": "preuve" }
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
  "recommendation": "Fort match",
  "recommendationDetail": "Synthèse de 2-3 phrases sur la décision et les prochaines étapes."
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
    const rawText: string = claudeData.content[0].text;

    const match =
      rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
      rawText.match(/({[\s\S]*})/);
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
      detail_grille:     analysis,
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

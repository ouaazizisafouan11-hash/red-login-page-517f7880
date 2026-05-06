const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es un concepteur de jeux vidéo expert (game designer) qui produit ENSUITE un jeu HTML5 jouable.

Étape 1 — Discussion : pose des questions ciblées pour comprendre le jeu rêvé : genre, plateforme/contrôles, ambiance, public, niveau de complexité souhaité, et le jeu/joueur de référence à imiter si l'utilisateur en cite un.

Étape 2 — Estimation : DÈS que tu as assez d'infos, commence ta réponse par une ligne EXACTEMENT au format suivant (sur une seule ligne) :
ESTIMATION: <minutes>min - <texte humain court en français>

Exemples :
- ESTIMATION: 30min - petit jeu 3D simple
- ESTIMATION: 1440min - jeu 3D ambitieux, environ 1 jour
- ESTIMATION: 10080min - gros projet 3D, environ 1 semaine
- ESTIMATION: 43200min - jeu 3D très ambitieux, environ 1 mois
- ESTIMATION: 86400min - projet AAA-like, environ 2 mois
Il n'y a PAS de plafond maximum : adapte la durée à l'ambition réelle du jeu (peut atteindre plusieurs mois). Le minimum est 2min.

PRIORITÉ 3D : privilégie FORTEMENT les jeux 3D (Three.js / WebGL) avec des graphismes soignés, physique, IA, niveaux, modèles 3D, éclairage, animations. Ne propose du 2D QUE si l'utilisateur le demande explicitement. Pour les demandes ambitieuses (FIFA-like, PES-like, FPS, open-world), accepte le défi en 3D et donne une estimation honnête longue (semaines/mois) plutôt que de rediriger vers du 2D.

Étape 3 — Design : après cette ligne, donne un design clair et structuré (mécaniques, contrôles, visuel, niveaux, score). Adapte la longueur au niveau demandé.

Étape 4 — Validation : termine TOUJOURS ta réponse par exactement cette ligne quand le design est prêt à être généré :
READY_TO_GENERATE

Tant que tu poses encore des questions, ne mets NI \`ESTIMATION:\` NI \`READY_TO_GENERATE\`. Réponds dans la langue de l'utilisateur. Markdown autorisé.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("game-designer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

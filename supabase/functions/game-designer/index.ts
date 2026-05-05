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
- ESTIMATION: 5min - jeu très simple, prêt en quelques minutes
- ESTIMATION: 30min - jeu 2D moyen, environ une demi-heure
- ESTIMATION: 480min - jeu ambitieux, environ 8h de génération
- ESTIMATION: 2880min - projet très ambitieux, environ 2 jours
Le minimum réaliste est 2min, le maximum 4320min (3 jours). Sois honnête : un clone de FIFA/PES n'est PAS faisable, redirige alors vers une version 2D simplifiée.

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

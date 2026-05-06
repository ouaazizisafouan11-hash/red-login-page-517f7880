// Generates a complete playable HTML5 game using Lovable AI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es un développeur de jeux HTML5/3D expert (Three.js, WebGL). Tu reçois la description d'un jeu et tu DOIS produire UN SEUL fichier HTML complet, autonome, jouable directement dans un navigateur.

Règles ABSOLUES :
- Réponds UNIQUEMENT avec le code HTML complet (de <!DOCTYPE html> à </html>). Aucun texte avant ou après. Aucun markdown, aucun \`\`\`.
- Tout en un seul fichier : HTML + CSS + JavaScript inline. Tu PEUX utiliser Three.js via CDN (https://unpkg.com/three@0.160.0/build/three.module.js) et ses addons (OrbitControls, GLTFLoader, etc.) car c'est essentiel pour la 3D.
- PRIORITÉ 3D : sauf si l'utilisateur demande explicitement du 2D, fais un jeu 3D avec Three.js : caméra, lumières (ambient + directional + shadows), matériaux PBR, géométries détaillées, skybox/fog, particules, post-processing si pertinent.
- Le jeu DOIT être jouable, avec contrôles clavier/souris (WASD + souris pour FPS/TPS, flèches pour autres), score, et game over/restart.
- Vise un visuel le plus impressionnant possible : modèles procéduraux soignés (composer plusieurs meshes pour personnages/véhicules), animations fluides, physique simple (gravité, collisions), IA ennemis si pertinent.
- Adapte la complexité à l'ambition demandée : pour un projet "ambitieux" (FIFA-like, FPS, open-world), génère un code LONG et riche (plusieurs milliers de lignes acceptées) avec plusieurs systèmes (gameplay, IA, niveaux, HUD, menu).
- Canvas plein écran responsive, fond élégant, HUD avec titre/contrôles/score.
- Code propre, requestAnimationFrame, pas de bugs bloquants.

IMPORTANT : Sortie = UN SEUL bloc HTML brut. Rien d'autre.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { gameId } = await req.json();
    if (!gameId) throw new Error("gameId required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: game, error: gErr } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();
    if (gErr || !game) throw new Error("Game not found");

    await supabase
      .from("games")
      .update({ status: "generating" })
      .eq("id", gameId);

    // Background generation
    const generate = async () => {
      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `Titre: ${game.title}\n\nDescription complète:\n${game.prompt}` },
            ],
          }),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`AI ${resp.status}: ${txt.slice(0, 200)}`);
        }
        const data = await resp.json();
        let html: string = data.choices?.[0]?.message?.content || "";
        // Clean potential code fences
        html = html.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
        if (!html.toLowerCase().includes("<!doctype") && !html.toLowerCase().includes("<html")) {
          throw new Error("AI did not return valid HTML");
        }

        await supabase
          .from("games")
          .update({
            status: "ready",
            html_code: html,
            completed_at: new Date().toISOString(),
          })
          .eq("id", gameId);
      } catch (e) {
        console.error("generation failed", e);
        await supabase
          .from("games")
          .update({
            status: "failed",
            error_message: e instanceof Error ? e.message : String(e),
          })
          .eq("id", gameId);
      }
    };

    // Fire and forget
    // @ts-ignore EdgeRuntime
    EdgeRuntime.waitUntil(generate());

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

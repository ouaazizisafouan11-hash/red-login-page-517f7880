import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code : "";

    const expected = Deno.env.get("OWNER_EDIT_CODE") ?? "";

    if (!expected) {
      return new Response(
        JSON.stringify({ ok: false, error: "Code non configuré" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ok = code.length > 0 && code === expected;
    return new Response(JSON.stringify({ ok }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_e) {
    return new Response(JSON.stringify({ ok: false, error: "Requête invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

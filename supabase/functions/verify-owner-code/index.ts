import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "verify";
    const code = typeof body?.code === "string" ? body.code : "";
    const expected = Deno.env.get("OWNER_EDIT_CODE") ?? "";

    if (!expected) {
      return new Response(
        JSON.stringify({ ok: false, error: "Code non configuré" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (code.length === 0 || code !== expected) {
      // Small delay to slow down brute force
      await new Promise((r) => setTimeout(r, 500));
      return new Response(JSON.stringify({ ok: false, error: "Code incorrect" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save") {
      const data = body?.data ?? {};
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const admin = createClient(supabaseUrl, serviceKey);

      const payload = {
        id: 1,
        first_name: typeof data.first_name === "string" ? data.first_name : null,
        last_name: typeof data.last_name === "string" ? data.last_name : null,
        age:
          data.age === null || data.age === undefined || data.age === ""
            ? null
            : Number(data.age),
        email: typeof data.email === "string" ? data.email : null,
        phone: typeof data.phone === "string" ? data.phone : null,
        address: typeof data.address === "string" ? data.address : null,
        bio: typeof data.bio === "string" ? data.bio : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await admin
        .from("owner_info")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        return new Response(
          JSON.stringify({ ok: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "Action inconnue" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_e) {
    return new Response(JSON.stringify({ ok: false, error: "Requête invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

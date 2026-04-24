import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const PersonalDescription = () => {
  const { user } = useAuth();
  const [description, setDescription] = useState<string>("");
  const [draft, setDraft] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("description")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        toast({ title: "Erreur de chargement", description: error.message, variant: "destructive" });
      } else {
        setDescription(data?.description ?? "");
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const startEdit = () => {
    setDraft(description);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft("");
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: user.id, description: draft }, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setDescription(draft);
      setEditing(false);
      toast({ title: "Enregistré", description: "Votre description a été mise à jour." });
    }
    setSaving(false);
  };

  return (
    <div
      className="w-full rounded-lg bg-card p-6"
      style={{ boxShadow: "var(--shadow-glow)" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">À propos de moi</h2>
        {!editing && !loading && (
          <button
            onClick={startEdit}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Modifier
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-3 text-accent">Chargement...</p>
      ) : editing ? (
        <div className="mt-3 space-y-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder="Parlez-nous de vous..."
            className="text-foreground"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="rounded-md border border-border px-4 py-2 text-sm font-bold text-accent transition-colors hover:bg-muted disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-accent">
          {description || "Aucune description. Cliquez sur Modifier pour en ajouter une."}
        </p>
      )}
    </div>
  );
};

export default PersonalDescription;

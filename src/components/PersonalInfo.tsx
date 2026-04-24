import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Phone, MapPin, User, Calendar, Pencil, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  phone: string | null;
  address: string | null;
  description: string | null;
}

const emptyProfile: ProfileData = {
  first_name: "",
  last_name: "",
  age: null,
  phone: "",
  address: "",
  description: "",
};

const PersonalInfo = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [draft, setDraft] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, age, phone, address, description")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data ?? emptyProfile);
      setDraft(data ?? emptyProfile);
      setLoading(false);
    };
    load();
  }, [user]);

  const startEdit = () => {
    setDraft(profile ?? emptyProfile);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile ?? emptyProfile);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      first_name: draft.first_name?.trim() || null,
      last_name: draft.last_name?.trim() || null,
      age: draft.age === null || draft.age === undefined || (draft.age as any) === "" ? null : Number(draft.age),
      phone: draft.phone?.trim() || null,
      address: draft.address?.trim() || null,
      description: draft.description?.trim() || null,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    setProfile(payload as ProfileData);
    setEditing(false);
    toast({ title: "Enregistré", description: "Vos informations ont été mises à jour." });
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-card p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <p className="text-accent">Chargement...</p>
      </div>
    );
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  const inputClass =
    "mt-1 w-full rounded-md bg-input px-3 py-2 text-accent placeholder:text-accent/60 focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-card p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">Informations personnelles</h2>
          {!editing ? (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground hover:bg-primary/80"
            >
              <Pencil className="h-3.5 w-3.5" /> Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-accent hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" /> Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" /> {saving ? "..." : "Enregistrer"}
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <ul className="space-y-3 text-foreground">
            <li className="flex items-center gap-3">
              <User className="h-4 w-4 text-primary" />
              <span className="text-accent">Nom :</span>
              <span>{fullName || "Non renseigné"}</span>
            </li>
            <li className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-accent">Âge :</span>
              <span>{profile?.age ?? "Non renseigné"}</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-accent">Email :</span>
              <span className="break-all">{user?.email}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-accent">Téléphone :</span>
              <span>{profile?.phone || "Non renseigné"}</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-1 h-4 w-4 text-primary" />
              <span className="text-accent">Adresse :</span>
              <span className="whitespace-pre-wrap">{profile?.address || "Non renseignée"}</span>
            </li>
          </ul>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-accent">Prénom</span>
              <input
                className={inputClass}
                value={draft.first_name ?? ""}
                onChange={(e) => setDraft({ ...draft, first_name: e.target.value })}
                placeholder="Prénom"
              />
            </label>
            <label className="text-sm">
              <span className="text-accent">Nom</span>
              <input
                className={inputClass}
                value={draft.last_name ?? ""}
                onChange={(e) => setDraft({ ...draft, last_name: e.target.value })}
                placeholder="Nom"
              />
            </label>
            <label className="text-sm">
              <span className="text-accent">Âge</span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={draft.age ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, age: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="Âge"
              />
            </label>
            <label className="text-sm">
              <span className="text-accent">Téléphone</span>
              <input
                className={inputClass}
                value={draft.phone ?? ""}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-accent">Adresse</span>
              <textarea
                className={inputClass}
                rows={2}
                value={draft.address ?? ""}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                placeholder="Rue, ville, pays"
              />
            </label>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-card p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <h2 className="mb-3 text-xl font-bold text-primary">Bio</h2>
        {!editing ? (
          <p className="whitespace-pre-wrap text-accent">
            {profile?.description || "Aucune bio renseignée."}
          </p>
        ) : (
          <textarea
            className={inputClass}
            rows={4}
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Parlez de vous..."
          />
        )}
      </div>
    </div>
  );
};

export default PersonalInfo;

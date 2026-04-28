import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, User, Calendar, Pencil, Save, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface OwnerData {
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  bio: string | null;
}

const empty: OwnerData = {
  first_name: "",
  last_name: "",
  age: null,
  email: "",
  phone: "",
  address: "",
  bio: "",
};

const inputClass =
  "mt-1 w-full rounded-md bg-input px-3 py-2 text-accent placeholder:text-accent/60 focus:outline-none focus:ring-2 focus:ring-ring";

const OwnerInfo = () => {
  const [data, setData] = useState<OwnerData>(empty);
  const [draft, setDraft] = useState<OwnerData>(empty);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Code modal state
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: row } = await supabase
        .from("owner_info")
        .select("first_name, last_name, age, email, phone, address, bio")
        .eq("id", 1)
        .maybeSingle();
      if (row) {
        setData(row as OwnerData);
        setDraft(row as OwnerData);
      }
      setLoading(false);
    };
    load();
  }, []);

  const requestEdit = () => {
    setCode("");
    setCodeOpen(true);
  };

  const submitCode = async () => {
    if (!code.trim()) return;
    setVerifying(true);
    const { data: res, error } = await supabase.functions.invoke("verify-owner-code", {
      body: { action: "verify", code: code.trim() },
    });
    setVerifying(false);
    if (error || !res?.ok) {
      toast.error("Code incorrect", {
        description: "Vous n'avez pas l'autorisation de modifier ces informations.",
      });
      return;
    }
    setVerifiedCode(code.trim());
    setCodeOpen(false);
    setDraft(data);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(data);
    setEditing(false);
  };

  const save = async () => {
    if (!verifiedCode) return;
    setSaving(true);
    const cleaned: OwnerData = {
      first_name: draft.first_name?.trim() || null,
      last_name: draft.last_name?.trim() || null,
      age:
        draft.age === null || draft.age === undefined || (draft.age as any) === ""
          ? null
          : Number(draft.age),
      email: draft.email?.trim() || null,
      phone: draft.phone?.trim() || null,
      address: draft.address?.trim() || null,
      bio: draft.bio?.trim() || null,
    };
    const { data: res, error } = await supabase.functions.invoke("verify-owner-code", {
      body: { action: "save", code: verifiedCode, data: cleaned },
    });
    setSaving(false);
    if (error || !res?.ok) {
      toast.error("Erreur", {
        description: res?.error || "Impossible d'enregistrer.",
      });
      return;
    }
    setData(cleaned);
    setEditing(false);
    toast.success("Enregistré", { description: "Vos informations ont été mises à jour." });
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-card p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <p className="text-accent">Chargement...</p>
      </div>
    );
  }

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-card p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">Informations personnelles</h2>
          {!editing ? (
            <button
              onClick={requestEdit}
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
                onClick={save}
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
              <span>{data.age ?? "Non renseigné"}</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-accent">Email :</span>
              <span className="break-all">{data.email || "Non renseigné"}</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-accent">Téléphone :</span>
              <span>{data.phone || "Non renseigné"}</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-1 h-4 w-4 text-primary" />
              <span className="text-accent">Adresse :</span>
              <span className="whitespace-pre-wrap">{data.address || "Non renseignée"}</span>
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
              />
            </label>
            <label className="text-sm">
              <span className="text-accent">Nom</span>
              <input
                className={inputClass}
                value={draft.last_name ?? ""}
                onChange={(e) => setDraft({ ...draft, last_name: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="text-accent">Âge</span>
              <input
                type="number"
                className={inputClass}
                value={draft.age ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, age: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </label>
            <label className="text-sm">
              <span className="text-accent">Email</span>
              <input
                type="email"
                className={inputClass}
                value={draft.email ?? ""}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="text-accent">Téléphone</span>
              <input
                className={inputClass}
                value={draft.phone ?? ""}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-accent">Adresse</span>
              <textarea
                className={inputClass}
                rows={2}
                value={draft.address ?? ""}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              />
            </label>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-card p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <h2 className="mb-3 text-xl font-bold text-primary">Bio</h2>
        {!editing ? (
          <p className="whitespace-pre-wrap text-accent">
            {data.bio || "Aucune bio renseignée."}
          </p>
        ) : (
          <textarea
            className={inputClass}
            rows={4}
            value={draft.bio ?? ""}
            onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
          />
        )}
      </div>

      <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Code requis
            </DialogTitle>
            <DialogDescription>
              Entrez le code secret pour modifier les informations du propriétaire.
            </DialogDescription>
          </DialogHeader>
          <input
            type="password"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitCode();
            }}
            placeholder="Code secret"
            className={inputClass}
          />
          <DialogFooter>
            <button
              onClick={() => setCodeOpen(false)}
              className="rounded-md border border-border px-4 py-2 text-sm text-accent hover:bg-muted"
            >
              Annuler
            </button>
            <button
              onClick={submitCode}
              disabled={verifying || !code.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
            >
              {verifying ? "Vérification..." : "Valider"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerInfo;

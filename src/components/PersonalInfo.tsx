import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Phone, MapPin, User, Calendar } from "lucide-react";

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  phone: string | null;
  address: string | null;
  description: string | null;
}

const PersonalInfo = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, age, phone, address, description")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-lg bg-card p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <p className="text-accent">Chargement...</p>
      </div>
    );
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-card p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <h2 className="mb-4 text-xl font-bold text-primary">Informations personnelles</h2>
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
      </div>

      <div className="rounded-lg bg-card p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <h2 className="mb-3 text-xl font-bold text-primary">Bio</h2>
        <p className="whitespace-pre-wrap text-accent">
          {profile?.description || "Aucune bio renseignée."}
        </p>
      </div>
    </div>
  );
};

export default PersonalInfo;

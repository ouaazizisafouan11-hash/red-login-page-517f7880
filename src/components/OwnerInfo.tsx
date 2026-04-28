import { Mail, Phone, MapPin, User, Calendar } from "lucide-react";

// Informations du propriétaire du site — modifiables uniquement ici dans le code.
// Aucun visiteur ne peut les changer depuis le site.
const OWNER = {
  firstName: "Adnane",
  lastName: "Ouaazizi",
  age: 16,
  email: "ouaazizisafouan11@gmail.com",
  phone: "+212 6 00 00 00 00",
  address: "Maroc",
  bio:
    "Bienvenue sur mon site ! Je m'appelle Adnane et c'est mon premier projet web. " +
    "J'apprends le développement web et je suis passionné par le code.",
};

const OwnerInfo = () => {
  const fullName = `${OWNER.firstName} ${OWNER.lastName}`.trim();

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-card p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <h2 className="mb-4 text-xl font-bold text-primary">Informations personnelles</h2>
        <ul className="space-y-3 text-foreground">
          <li className="flex items-center gap-3">
            <User className="h-4 w-4 text-primary" />
            <span className="text-accent">Nom :</span>
            <span>{fullName}</span>
          </li>
          <li className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-accent">Âge :</span>
            <span>{OWNER.age}</span>
          </li>
          <li className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-accent">Email :</span>
            <span className="break-all">{OWNER.email}</span>
          </li>
          <li className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-accent">Téléphone :</span>
            <span>{OWNER.phone}</span>
          </li>
          <li className="flex items-start gap-3">
            <MapPin className="mt-1 h-4 w-4 text-primary" />
            <span className="text-accent">Adresse :</span>
            <span className="whitespace-pre-wrap">{OWNER.address}</span>
          </li>
        </ul>
      </div>

      <div className="rounded-lg bg-card p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <h2 className="mb-3 text-xl font-bold text-primary">Bio</h2>
        <p className="whitespace-pre-wrap text-accent">{OWNER.bio}</p>
      </div>
    </div>
  );
};

export default OwnerInfo;

import { HandCoins, Eye, BellOff, FolderX } from "lucide-react";

const pains = [
  {
    icon: HandCoins,
    color: "hsl(38 95% 52%)",
    title: "Vous présentez des gens. Vous ne gagnez rien.",
    desc: "Vos mises en relation créent de la valeur pour les autres. Rarement pour vous.",
  },
  {
    icon: Eye,
    color: "hsl(24 100% 55%)",
    title: "Personne ne reconnaît ce que vous avez apporté.",
    desc: "L'affaire se conclut. Mais vous ne pouvez pas prouver que c'est grâce à vous.",
  },
  {
    icon: BellOff,
    color: "hsl(38 80% 48%)",
    title: "Vous envoyez et puis... plus de nouvelles.",
    desc: "Vous avez fait la présentation. Après, silence total. Vous ne savez même pas si ça a abouti.",
  },
  {
    icon: FolderX,
    color: "hsl(24 90% 60%)",
    title: "Tout est dans votre tête. Rien n'est rangé.",
    desc: "Pas d'endroit pour garder la trace de vos présentations. Tout finit par se perdre.",
  },
];

export default function FacilitateurPainSection() {
  return (
    <section className="py-20 md:py-24 bg-background">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <p className="pill-tag mb-4 mx-auto w-fit">Pour les facilitateurs</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Votre réseau vaut de l'argent.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, hsl(24 100% 58%), hsl(38 100% 65%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Mais personne ne le sait.
            </span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto">
            Vous présentez des gens depuis des années. Mais c'est informel, invisible,{" "}
            <strong className="text-foreground font-semibold">rarement payé.</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pains.map(({ icon: Icon, color, title, desc }) => {
            const bg = color.replace(")", " / 0.08)");
            const border = color.replace(")", " / 0.2)");
            return (
              <div
                key={title}
                className="bg-card border rounded-2xl p-6 flex gap-4 items-start transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ borderColor: border }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: bg, border: `1px solid ${border}` }}
                >
                  <Icon size={17} style={{ color }} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm mb-2 leading-snug">{title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mt-8 rounded-2xl px-6 py-5 text-center border"
          style={{
            background: "linear-gradient(135deg, hsl(24 80% 6%), hsl(38 70% 9%))",
            borderColor: "hsl(24 100% 55% / 0.2)",
          }}
        >
          <p className="text-white/85 text-sm font-semibold">
            WiinupMax organise vos présentations et garde la preuve de chacune d'elles.{" "}
            <span className="text-white/60 font-normal">
              Vous êtes payé. Vous avez la preuve. Vous gardez le contrôle.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

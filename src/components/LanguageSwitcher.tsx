import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, setLanguage } from "@/lib/i18n";
import { Globe, ChevronDown, Check } from "lucide-react";

interface LanguageSwitcherProps {
  compact?: boolean;
}

export default function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleSelect = (code: string) => {
    setLanguage(code);
    setOpen(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Globe size={13} />
          <span>{current.flag} {current.code.toUpperCase()}</span>
          <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className="absolute top-full mt-1 right-0 z-50 min-w-[200px] rounded-xl border shadow-lg overflow-hidden"
              style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
            >
              <div className="p-1.5">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-muted"
                    dir={lang.rtl ? "rtl" : "ltr"}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <span className="font-medium text-foreground">{lang.native}</span>
                      {lang.rtl && (
                        <span className="text-xs text-muted-foreground">RTL</span>
                      )}
                    </div>
                    {i18n.language === lang.code && (
                      <Check size={13} className="text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-muted"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <Globe size={15} className="text-muted-foreground" />
        <span className="text-foreground">{current.flag} {current.native}</span>
        <ChevronDown size={13} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full mt-2 right-0 z-50 min-w-[220px] rounded-xl border shadow-xl overflow-hidden"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: "hsl(var(--border))" }}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Choisir la langue</p>
            </div>
            <div className="p-1.5 grid grid-cols-2 gap-0.5">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                    i18n.language === lang.code ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                  dir={lang.rtl ? "rtl" : "ltr"}
                >
                  <span className="text-base">{lang.flag}</span>
                  <div className="flex-1 text-left" dir="ltr">
                    <p className={`text-xs font-semibold ${i18n.language === lang.code ? "text-primary" : "text-foreground"}`}>
                      {lang.native}
                    </p>
                  </div>
                  {i18n.language === lang.code && (
                    <Check size={12} className="text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

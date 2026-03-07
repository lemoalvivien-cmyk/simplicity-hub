/**
 * useRTL — Applies dir="rtl" or dir="ltr" to the <html> element
 * and returns whether current language is RTL.
 * Must be called once at the App root level.
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RTL_LANGUAGES } from "@/lib/i18n";

export function useRTL(): boolean {
  const { i18n } = useTranslation();
  const isRTL = RTL_LANGUAGES.includes(i18n.language);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", isRTL ? "rtl" : "ltr");
    html.setAttribute("lang", i18n.language);
  }, [i18n.language, isRTL]);

  return isRTL;
}

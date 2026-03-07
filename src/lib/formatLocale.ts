/**
 * formatLocale.ts — Intl formatting utilities for WIINUP MAX
 * All dates, amounts, numbers use the user's active language locale.
 */

// Map i18n codes → Intl locale strings
const LOCALE_MAP: Record<string, string> = {
  fr: "fr-FR",
  en: "en-GB",
  es: "es-ES",
  pt: "pt-BR",
  ru: "ru-RU",
  zh: "zh-CN",
  hi: "hi-IN",
  bn: "bn-BD",
  ar: "ar-SA",
  he: "he-IL",
};

export function toIntlLocale(code: string): string {
  return LOCALE_MAP[code] ?? "en-GB";
}

/** Format a monetary amount: 490 € / $490 / etc. */
export function formatAmount(value: number, lang: string, currency = "EUR"): string {
  try {
    return new Intl.NumberFormat(toIntlLocale(lang), {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} €`;
  }
}

/** Format a number with locale separators */
export function formatNumber(value: number, lang: string): string {
  try {
    return new Intl.NumberFormat(toIntlLocale(lang)).format(value);
  } catch {
    return String(value);
  }
}

/** Format a percentage */
export function formatPercent(value: number, lang: string): string {
  try {
    return new Intl.NumberFormat(toIntlLocale(lang), {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(value / 100);
  } catch {
    return `${value}%`;
  }
}

/** Format a date (short: "12 jan. 2025") */
export function formatDateShort(date: Date | string, lang: string): string {
  try {
    return new Intl.DateTimeFormat(toIntlLocale(lang), {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

/** Format a date (relative: "il y a 3 jours" / "3 days ago") */
export function formatDateRelative(date: Date | string, lang: string): string {
  try {
    const diff = Math.round((Date.now() - new Date(date).getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(toIntlLocale(lang), { numeric: "auto" });
    if (diff < 60) return rtf.format(-diff, "second");
    if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
    if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
    return rtf.format(-Math.round(diff / 86400), "day");
  } catch {
    return formatDateShort(date, lang);
  }
}

/** Format an abbreviated large number: 1.2K, 45K, etc. */
export function formatCompact(value: number, lang: string): string {
  try {
    return new Intl.NumberFormat(toIntlLocale(lang), {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return formatNumber(value, lang);
  }
}

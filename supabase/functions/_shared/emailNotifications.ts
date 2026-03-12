/**
 * Real email notifications via Resend
 * Templates :
 *   - sendWelcomeEmail          → Bienvenue sur WIINUP MAX après signup confirmé
 *   - sendGainPayeEmail         → "Gain payé XX €"
 *   - sendIntroValideeEmail     → "Nouvelle intro validée"
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL     = "WIINUP MAX <notifications@wiinupmax.com>";
const APP_URL        = "https://wiinupmax.lovable.app";

// ── Brand tokens (align with index.css design system) ────────────────────────
const COLOR = {
  bgPage:    "#f1f5f9",        // --background
  bgCard:    "#ffffff",
  primary:   "#0f2d6b",        // hsl(218 72% 18%)
  accent:    "#ff6b00",        // hsl(24 100% 52%)  -- orange exécution
  electric:  "#1a72c7",        // hsl(210 85% 42%)
  success:   "#1d8a52",        // hsl(152 62% 34%)
  text:      "#0d1829",        // --foreground
  textMuted: "#6a7796",        // --muted-foreground
  border:    "#e8ecf3",
  shadow:    "0 4px 24px rgba(15,45,107,0.10)",
};

// ── Shared email shell ────────────────────────────────────────────────────────
function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.bgPage};font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.bgPage};padding:48px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:${COLOR.bgCard};border-radius:16px;overflow:hidden;box-shadow:${COLOR.shadow};max-width:580px;width:100%;">
        <!-- Header bar -->
        <tr>
          <td style="background:linear-gradient(135deg,${COLOR.primary} 0%,#1a3e7a 100%);padding:28px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;font-weight:700;">WIINUP MAX</p>
          </td>
        </tr>
        <!-- Body -->
        ${body}
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid ${COLOR.border};">
            <p style="margin:0;font-size:12px;color:${COLOR.textMuted};text-align:center;line-height:1.7;">
              WIINUP MAX — La plateforme de mise en relation B2B par apport d'affaires<br>
              <a href="${APP_URL}" style="color:#64748b;text-decoration:none;">wiinupmax.lovable.app</a>
              &nbsp;·&nbsp;
              <a href="${APP_URL}/confidentialite" style="color:#64748b;text-decoration:none;">Confidentialité</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Generic send ──────────────────────────────────────────────────────────────
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[email] Resend error:", res.status, err);
      return false;
    }
    const data = await res.json();
    console.log("[email] Sent:", data.id, "→", opts.to);
    return true;
  } catch (e) {
    console.error("[email] Send failed:", e);
    return false;
  }
}

// ── Template: Welcome onboarding ──────────────────────────────────────────────
export async function sendWelcomeEmail(opts: {
  to: string;
  prenom: string;
}): Promise<boolean> {
  const body = `
    <tr><td style="padding:40px 40px 0;">
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:${COLOR.text};">
        Bienvenue, ${opts.prenom} 👋
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:${COLOR.textMuted};line-height:1.7;">
        Votre compte WIINUP MAX est actif. Vous pouvez désormais accéder à votre espace et commencer à générer des introductions qualifiées.
      </p>

      <!-- Steps -->
      <div style="border:1px solid ${COLOR.border};border-radius:12px;overflow:hidden;margin-bottom:32px;">
        ${[
          ["1", `${COLOR.primary}`, "Complétez votre profil", "Renseignez votre secteur, zone et réseau pour être visible des entreprises."],
          ["2", `${COLOR.electric}`, "Parcourez les missions", "Découvrez les offres d'entreprises et soumettez vos premières introductions."],
          ["3", `${COLOR.success}`,  "Touchez vos gains", "Chaque introduction validée déclenche un virement automatique sur votre compte Stripe."],
        ].map(([num, color, title, desc], i) => `
          <div style="padding:16px 20px;${i > 0 ? `border-top:1px solid ${COLOR.border};` : ""}display:flex;gap:14px;align-items:flex-start;">
            <div style="min-width:28px;height:28px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;text-align:center;line-height:28px;">${num}</div>
            <div>
              <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:${COLOR.text};">${title}</p>
              <p style="margin:0;font-size:13px;color:${COLOR.textMuted};line-height:1.5;">${desc}</p>
            </div>
          </div>
        `).join("")}
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:36px;">
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:${COLOR.accent};color:#fff;font-size:15px;font-weight:700;padding:16px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
          Accéder à mon espace →
        </a>
      </div>

      <p style="margin:0 0 40px;font-size:13px;color:${COLOR.textMuted};line-height:1.6;text-align:center;">
        Des questions ? Répondez directement à cet email — notre équipe est là.
      </p>
    </td></tr>
  `;

  return sendEmail({
    to: opts.to,
    subject: `Bienvenue sur WIINUP MAX, ${opts.prenom} 🚀`,
    html: shell(`Bienvenue sur WIINUP MAX`, body),
  });
}

// ── Template: Gain payé ────────────────────────────────────────────────────────
export async function sendGainPayeEmail(opts: {
  to: string;
  facilitatorName: string;
  amount: number;
  currency: string;
  transferId: string;
  payoutId: string;
}): Promise<boolean> {
  const amountFormatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: opts.currency.toUpperCase(),
  }).format(opts.amount);

  const body = `
    <tr><td style="padding:40px 40px 0;">
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:${COLOR.text};">💸 Gain payé !</h1>
      <p style="margin:0 0 28px;font-size:15px;color:${COLOR.textMuted};line-height:1.7;">
        Bonjour <strong style="color:${COLOR.text};">${opts.facilitatorName}</strong>,<br>
        Votre gain vient d'être transféré sur votre compte Stripe Connect. 🎉
      </p>

      <!-- Amount -->
      <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:14px;padding:28px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 4px;font-size:12px;color:${COLOR.success};font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Montant transféré</p>
        <p style="margin:0;font-size:46px;font-weight:800;color:${COLOR.success};">${amountFormatted}</p>
      </div>

      <!-- Details -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid ${COLOR.border};border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:12px 16px;background:#f8fafc;border-bottom:1px solid ${COLOR.border};font-size:12px;color:${COLOR.textMuted};font-weight:600;text-transform:uppercase;letter-spacing:1px;" colspan="2">Détails du virement</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${COLOR.border};font-size:13px;color:${COLOR.textMuted};">Référence Stripe</td>
          <td style="padding:12px 16px;border-bottom:1px solid ${COLOR.border};font-size:13px;color:${COLOR.text};text-align:right;font-family:monospace;">${opts.transferId}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:${COLOR.textMuted};">ID Payout</td>
          <td style="padding:12px 16px;font-size:13px;color:${COLOR.text};text-align:right;font-family:monospace;">${opts.payoutId.substring(0, 10)}…</td>
        </tr>
      </table>

      <div style="text-align:center;margin-bottom:32px;">
        <a href="${APP_URL}/gains" style="display:inline-block;background:${COLOR.primary};color:#fff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
          Voir mon historique de gains →
        </a>
      </div>

      <p style="margin:0 0 40px;font-size:13px;color:${COLOR.textMuted};line-height:1.6;">
        Les fonds seront disponibles sur votre compte bancaire selon les délais Stripe (généralement 2–7 jours ouvrés).
      </p>
    </td></tr>
  `;

  return sendEmail({
    to: opts.to,
    subject: `💸 Gain payé — ${amountFormatted} transféré sur votre compte`,
    html: shell("Gain payé", body),
  });
}

// ── Template: Nouvelle intro validée ──────────────────────────────────────────
export async function sendIntroValideeEmail(opts: {
  to: string;
  facilitatorName: string;
  contactName: string;
  missionTitre: string;
  introductionId: string;
  gainEstimate?: number;
}): Promise<boolean> {
  const gainStr = opts.gainEstimate
    ? `<p style="margin:0 0 24px;font-size:15px;color:${COLOR.textMuted};">
        Gain potentiel associé : 
        <strong style="color:${COLOR.success};">${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(opts.gainEstimate)}</strong>
       </p>`
    : "";

  const body = `
    <tr><td style="padding:40px 40px 0;">
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:${COLOR.text};">✅ Introduction validée !</h1>
      <p style="margin:0 0 28px;font-size:15px;color:${COLOR.textMuted};line-height:1.7;">
        Bonjour <strong style="color:${COLOR.text};">${opts.facilitatorName}</strong>,<br>
        L'entreprise a <strong>validé votre introduction</strong>. Votre gain est en cours de traitement.
      </p>

      <!-- Info box -->
      <div style="background:#eff6ff;border:2px solid #93c5fd;border-radius:14px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 14px;font-size:12px;color:${COLOR.electric};font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Détails de l'introduction</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #dbeafe;font-size:13px;color:${COLOR.textMuted};">Contact introduit</td>
            <td style="padding:8px 0;border-bottom:1px solid #dbeafe;font-size:13px;color:${COLOR.text};text-align:right;font-weight:700;">${opts.contactName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:${COLOR.textMuted};">Mission</td>
            <td style="padding:8px 0;font-size:13px;color:${COLOR.text};text-align:right;font-weight:700;">${opts.missionTitre}</td>
          </tr>
        </table>
      </div>

      ${gainStr}

      <div style="text-align:center;margin-bottom:32px;">
        <a href="${APP_URL}/introductions/${opts.introductionId}" style="display:inline-block;background:${COLOR.primary};color:#fff;font-size:14px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;margin-right:8px;">
          Voir l'introduction →
        </a>
        <a href="${APP_URL}/gains" style="display:inline-block;background:#f1f5f9;color:${COLOR.text};font-size:14px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;">
          Mes gains
        </a>
      </div>

      <p style="margin:0 0 40px;font-size:13px;color:${COLOR.textMuted};line-height:1.6;">
        Le paiement sera traité lors du prochain batch de virements (délai max 30 jours ou dès que le seuil de 100 € est atteint).
      </p>
    </td></tr>
  `;

  return sendEmail({
    to: opts.to,
    subject: `✅ Introduction validée — ${opts.contactName} pour "${opts.missionTitre}"`,
    html: shell("Introduction validée", body),
  });
}

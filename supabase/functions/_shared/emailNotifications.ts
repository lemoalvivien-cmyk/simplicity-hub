/**
 * Real email notifications via Resend
 * Templates: "Gain payé XX €" + "Nouvelle intro validée"
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "WIINUP MAX <notifications@wiinupmax.com>";
const APP_URL = "https://wiinupmax.lovable.app";

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

// ── Template: Gain payé ────────────────────────────────────────────────────
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

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;font-weight:600;">WIINUP MAX</p>
          <h1 style="margin:12px 0 0;font-size:28px;font-weight:700;color:#ffffff;">💸 Gain payé !</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:15px;color:#475569;">Bonjour <strong>${opts.facilitatorName}</strong>,</p>
          <p style="margin:0 0 32px;font-size:15px;color:#475569;line-height:1.6;">
            Votre gain vient d'être transféré sur votre compte Stripe Connect. 🎉
          </p>
          <!-- Amount box -->
          <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
            <p style="margin:0 0 4px;font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Montant transféré</p>
            <p style="margin:0;font-size:42px;font-weight:800;color:#15803d;">${amountFormatted}</p>
          </div>
          <!-- Details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#94a3b8;font-weight:500;">Référence Stripe</td>
              <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;text-align:right;font-family:monospace;">${opts.transferId}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#94a3b8;font-weight:500;">ID Payout</td>
              <td style="padding:8px 0;font-size:13px;color:#1e293b;text-align:right;font-family:monospace;">${opts.payoutId.substring(0, 8)}…</td>
            </tr>
          </table>
          <!-- CTA -->
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${APP_URL}/gains" style="display:inline-block;background:#0f172a;color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
              Voir mon historique de gains →
            </a>
          </div>
          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
            Les fonds seront disponibles sur votre compte bancaire selon les délais Stripe (généralement 2–7 jours ouvrés).
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #f1f5f9;">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
            WIINUP MAX — La plateforme de mise en relation B2B par apport d'affaires<br>
            <a href="${APP_URL}" style="color:#64748b;text-decoration:none;">wiinupmax.lovable.app</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: opts.to,
    subject: `💸 Gain payé — ${amountFormatted} transféré sur votre compte`,
    html,
  });
}

// ── Template: Nouvelle intro validée ──────────────────────────────────────
export async function sendIntroValideeEmail(opts: {
  to: string;
  facilitatorName: string;
  contactName: string;
  missionTitre: string;
  introductionId: string;
  gainEstimate?: number;
}): Promise<boolean> {
  const gainStr = opts.gainEstimate
    ? `<p style="margin:0 0 24px;font-size:15px;color:#475569;">
        Gain potentiel associé à cette mission : 
        <strong style="color:#15803d;">${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(opts.gainEstimate)}</strong>
       </p>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;font-weight:600;">WIINUP MAX</p>
          <h1 style="margin:12px 0 0;font-size:28px;font-weight:700;color:#ffffff;">✅ Introduction validée !</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:15px;color:#475569;">Bonjour <strong>${opts.facilitatorName}</strong>,</p>
          <p style="margin:0 0 32px;font-size:15px;color:#475569;line-height:1.6;">
            Excellente nouvelle ! L'entreprise a <strong>validé votre introduction</strong>. Votre gain est en cours de traitement.
          </p>
          <!-- Info box -->
          <div style="background:#eff6ff;border:2px solid #93c5fd;border-radius:12px;padding:24px;margin-bottom:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#3b82f6;font-weight:600;text-transform:uppercase;letter-spacing:1px;" colspan="2">Détails de l'introduction</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #dbeafe;font-size:14px;color:#64748b;">Contact introduit</td>
                <td style="padding:8px 0;border-bottom:1px solid #dbeafe;font-size:14px;color:#1e293b;text-align:right;font-weight:600;">${opts.contactName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-size:14px;color:#64748b;">Mission</td>
                <td style="padding:8px 0;font-size:14px;color:#1e293b;text-align:right;font-weight:600;">${opts.missionTitre}</td>
              </tr>
            </table>
          </div>
          ${gainStr}
          <!-- CTA -->
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${APP_URL}/introductions/${opts.introductionId}" style="display:inline-block;background:#0f172a;color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
              Voir l'introduction →
            </a>
            &nbsp;&nbsp;
            <a href="${APP_URL}/gains" style="display:inline-block;background:#f1f5f9;color:#1e293b;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
              Mes gains
            </a>
          </div>
          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
            Le paiement sera traité lors du prochain batch de virements (délai max 30 jours ou dès que le seuil de 100 € est atteint).
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #f1f5f9;">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
            WIINUP MAX — La plateforme de mise en relation B2B par apport d'affaires<br>
            <a href="${APP_URL}" style="color:#64748b;text-decoration:none;">wiinupmax.lovable.app</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: opts.to,
    subject: `✅ Introduction validée — ${opts.contactName} pour la mission "${opts.missionTitre}"`,
    html,
  });
}

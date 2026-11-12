import { Resend } from "resend";
import type { InvitationRow } from "@/lib/invitations";

/**
 * Server-only invitation email sender (SPEC 08). Uses the `resend` npm package
 * (REST wrapper) with RESEND_API_KEY; must NEVER be imported from client
 * components. While the Resend account is in test mode, delivery only happens
 * to the account owner's own address (onboarding@resend.dev sender).
 */

export type SendEmailResult = { ok: true } | { ok: false; error: string };

// Defaults mirror .env.template; RESEND_FROM uses Resend's test-mode sender.
const DEFAULT_FROM = "Open DayCare <onboarding@resend.dev>";
const DEFAULT_APP_URL = "http://localhost:3000";

// Warm brand palette from the reference comps (background, card, ink, accent).
const BRAND = {
  background: "#f6ecdf",
  card: "#fffdf9",
  ink: "#3f362e",
  muted: "#7a6a58",
  accent: "#f2a78e",
  accentInk: "#4f2c1c",
} as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// "18 de noviembre de 2026" from the invitation's expires_at (UTC date part).
function formatExpirationLabel(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return "en 7 días";
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function buildActivationUrl(code: string): string {
  const appUrl = process.env.APP_URL || DEFAULT_APP_URL;
  return `${appUrl.replace(/\/+$/, "")}/activate-account?code=${encodeURIComponent(code)}`;
}

function renderEmailHtml(params: {
  fullName: string;
  childName: string;
  code: string;
  expiresLabel: string;
  activationUrl: string;
}): string {
  const fullName = escapeHtml(params.fullName);
  const childName = escapeHtml(params.childName);
  const code = escapeHtml(params.code);
  const url = escapeHtml(params.activationUrl);

  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:${BRAND.background};font-family:'Nunito','Segoe UI',Arial,sans-serif;color:${BRAND.ink};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.background};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:${BRAND.card};border-radius:20px;padding:32px;box-shadow:0 8px 24px rgba(63,54,46,0.08);">
            <tr>
              <td>
                <p style="margin:0 0 4px;font-family:'Fredoka','Trebuchet MS',sans-serif;font-size:22px;font-weight:600;color:${BRAND.ink};">Open DayCare ☀️</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:${BRAND.muted};">Hola ${fullName}:</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
                  Desde el equipo de la guardería te invitaron a seguir el día de <strong style="color:${BRAND.ink};">${childName}</strong>.
                  Activá tu cuenta para ver publicaciones, avisos y el resumen del día de tu hijo.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
                  <tr>
                    <td align="center" style="background-color:${BRAND.background};border-radius:14px;padding:18px;">
                      <p style="margin:0 0 6px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:${BRAND.muted};">Código de invitación</p>
                      <p style="margin:0;font-family:'Fredoka','Trebuchet MS',sans-serif;font-size:30px;font-weight:600;letter-spacing:8px;color:${BRAND.ink};">${code}</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 24px;text-align:center;">
                  <a href="${url}" style="display:inline-block;background-color:${BRAND.accent};color:${BRAND.accentInk};font-size:16px;font-weight:700;text-decoration:none;border-radius:999px;padding:14px 32px;">Activar mi cuenta</a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${BRAND.muted};">
                  El enlace te lleva a <strong>${url}</strong>. El código vence el <strong>${escapeHtml(params.expiresLabel)}</strong> (7 días).
                </p>
                <p style="margin:0;font-size:13px;line-height:1.5;color:${BRAND.muted};">
                  ¿No podés abrir el enlace? Ingresá el código manualmente en la pantalla “Activar cuenta”.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function renderEmailText(params: {
  fullName: string;
  childName: string;
  code: string;
  expiresLabel: string;
  activationUrl: string;
}): string {
  return [
    `Hola ${params.fullName}:`,
    "",
    `Desde el equipo de la guardería te invitaron a seguir el día de ${params.childName}.`,
    "Activá tu cuenta para ver publicaciones, avisos y el resumen del día de tu hijo.",
    "",
    `Código de invitación: ${params.code}`,
    `Activar cuenta: ${params.activationUrl}`,
    "",
    `El código vence el ${params.expiresLabel} (7 días).`,
    "Si no podés abrir el enlace, ingresá el código manualmente en la pantalla “Activar cuenta”.",
  ].join("\n");
}

/**
 * Sends the invitation email through Resend. Never throws: API failures come
 * back as `{ ok: false, error }` with a Spanish, user-displayable message
 * (the raw Resend error is only logged server-side).
 */
export async function sendInvitationEmail(params: {
  invitation: InvitationRow;
  childName: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "No se configuró la clave de API de Resend (RESEND_API_KEY)." };
  }

  const from = process.env.RESEND_FROM || DEFAULT_FROM;
  const { invitation, childName } = params;
  const activationUrl = buildActivationUrl(invitation.code);
  const expiresLabel = formatExpirationLabel(invitation.expires_at);
  const subject = `Te invitaron a seguir el día de ${childName}`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: invitation.email,
    subject,
    html: renderEmailHtml({
      fullName: invitation.full_name,
      childName,
      code: invitation.code,
      expiresLabel,
      activationUrl,
    }),
    text: renderEmailText({
      fullName: invitation.full_name,
      childName,
      code: invitation.code,
      expiresLabel,
      activationUrl,
    }),
  });

  if (error) {
    console.error("sendInvitationEmail: Resend rejected the send:", error);
    return {
      ok: false,
      error: "No se pudo enviar el correo de invitación. Verificá el email e intentá nuevamente.",
    };
  }

  return { ok: true };
}

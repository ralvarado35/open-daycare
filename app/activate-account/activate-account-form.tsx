"use client";

import Link from "next/link";
import { useState } from "react";
import { activateAccount, type ActivateAccountResult } from "./actions";
import type { InvitationLookup } from "@/lib/invitations";
import { SunIcon } from "@/app/components/icons";
import { loginHref } from "@/lib/nav";

/**
 * Activate-account form (SPEC 08). Controlled inputs (code prefilled from the
 * invitation link, uppercased as typed), photo-consent checkbox kept visual
 * only (no consent column in the schema yet) and submission through the
 * activateAccount Server Action. Success triggers redirect("/login?activated=1")
 * server-side, so only failures return here for on-screen display.
 */
export function ActivateAccountForm({
  initialCode,
  invitation,
}: {
  initialCode: string;
  invitation: InvitationLookup | null;
}) {
  const [code, setCode] = useState(initialCode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    const payload = new FormData();
    payload.set("code", code.trim().toUpperCase());
    payload.set("email", email.trim());
    payload.set("password", password);

    const result: ActivateAccountResult = await activateAccount(payload);
    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
    }
    // On success the action calls redirect() — nothing to do here.
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Invitation card: real kid from lookup_invitation, neutral otherwise */}
      {invitation ? (
        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border border-line bg-white px-4 py-[14px]">
          <div className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full bg-[#a9d9e8] font-display text-[19px] font-semibold text-[#1f7a93]">
            {invitation.childFirstName.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <div className="text-[13px] text-ink-soft">Te invitaron a seguir a</div>
            <div className="font-display text-[17px] font-semibold text-ink">
              {invitation.childFirstName} · Sala {invitation.childRoomName}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border border-line bg-white px-4 py-[14px]">
          <div className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full bg-[#fbf1d6]">
            <SunIcon size={22} className="text-[#c5503a]" />
          </div>
          <div className="text-[14.5px] leading-[1.4] text-ink-soft">
            Te invitaron a seguir el día de tu hijo
          </div>
        </div>
      )}

      {/* Invitation code (prefilled from ?code=, editable, uppercased) */}
      <label
        htmlFor="invitation-code"
        className="mb-[8px] block text-[12px] font-bold tracking-[0.7px] text-ink-soft"
      >
        CÓDIGO DE INVITACIÓN
      </label>
      <input
        id="invitation-code"
        type="text"
        value={code}
        autoComplete="off"
        required
        disabled={submitting}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
        className="mb-[18px] w-full rounded-[14px] border border-line bg-white px-4 py-[14px] font-display text-[18px] font-bold tracking-[3px] text-ink outline-none"
      />

      {/* Email */}
      <label
        htmlFor="activate-email"
        className="mb-[8px] block text-[12px] font-bold tracking-[0.7px] text-ink-soft"
      >
        EMAIL
      </label>
      <input
        id="activate-email"
        type="email"
        value={email}
        autoComplete="email"
        required
        disabled={submitting}
        onChange={(event) => setEmail(event.target.value)}
        className="mb-[18px] w-full rounded-[14px] border border-line bg-white px-4 py-[14px] text-[15px] text-ink outline-none"
      />

      {/* Create password */}
      <label
        htmlFor="activate-password"
        className="mb-[8px] block text-[12px] font-bold tracking-[0.7px] text-ink-soft"
      >
        CREAR CONTRASEÑA
      </label>
      <input
        id="activate-password"
        type="password"
        value={password}
        autoComplete="new-password"
        required
        minLength={6}
        disabled={submitting}
        onChange={(event) => setPassword(event.target.value)}
        className="mb-[18px] w-full rounded-[14px] border border-accent bg-white px-4 py-[14px] text-[15px] text-ink outline-none"
      />

      {/* Photo consent — visual only (SPEC 08 out of scope: not persisted) */}
      <label
        htmlFor="photo-consent"
        className="mb-[24px] flex cursor-pointer items-start gap-[12px] rounded-[14px] bg-[#fbf1d6] px-4 py-[14px]"
      >
        <input
          id="photo-consent"
          type="checkbox"
          defaultChecked
          disabled={submitting}
          className="mt-[1px] h-6 w-6 flex-none cursor-pointer appearance-none rounded-[8px] bg-[#5fb97e] checked:bg-[#5fb97e] checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%2220 6 9 17 4 12%22/></svg>')] checked:bg-center checked:bg-no-repeat checked:bg-[length:15px_15px]"
        />
        <span className="text-[14px] leading-[1.45] text-[#8a7234]">
          Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro
          de la app.
        </span>
      </label>

      {error && (
        <p className="mb-[14px] text-center text-[13px] font-bold text-[#c5503a]" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#f4977e,#ee8164)] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:opacity-70"
      >
        {submitting ? "Activando…" : "Activar mi cuenta"}
      </button>

      <p className="mt-[22px] text-center text-[14.5px] text-ink-soft">
        ¿Ya tenés cuenta?{" "}
        <Link href={loginHref} className="font-extrabold text-[#c5503a]">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}

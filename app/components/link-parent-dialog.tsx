"use client";

import { useEffect, useState } from "react";
import { sendParentInvitation } from "@/app/kids/actions";
import type { Relation } from "@/lib/invitations";
import { CloseIcon } from "./icons";

type LinkParentForm = {
  fullName: string;   // NOMBRE DEL PADRE/MADRE
  email: string;      // EMAIL
  relation: Relation; // PARENTESCO
};

// Modal state machine: idle (editable), sending (CTA disabled "Enviando…"),
// sent (success block with the real code + "Listo" closes the dialog).
type SendState = "idle" | "sending" | "sent";

const RELATIONS: { id: Relation; label: string }[] = [
  { id: "mama", label: "Mamá" },
  { id: "papa", label: "Papá" },
  { id: "tutor", label: "Tutor/a" },
];

/**
 * "Vincular padre" modal: self-contained client component triggered from the
 * "Vincular otro padre" link on /kids/[childId]. Mirrors
 * references/pantallas/vincular-padre.dc.html pixel-wise.
 * The CTA calls the sendParentInvitation Server Action (SPEC 08): it creates
 * the pending invitation, sends the activation email and reveals the generated
 * code in the success state. The code block shows "—" ("Se genera al enviar")
 * until the send succeeds — no code exists before submitting. Errors from the
 * server arrive already localized in Spanish and render under the CTA.
 *
 * Props:
 *   open      — whether the dialog is visible (owned by the trigger). The
 *               trigger mounts this component conditionally, so every open
 *               starts with a clean form and idle state.
 *   onClose   — called on X click, backdrop click, Escape, or "Listo";
 *               ignored while a send is in flight.
 *   childId   — children.id (uuid): the invitation is created for this kid.
 *   childName — full name of the kid (e.g. "Mateo Fernández"), shown in the
 *               header ("Vincular padre a Mateo") and in the notice copy.
 */
export function LinkParentDialog({
  open,
  onClose,
  childId,
  childName,
}: {
  open: boolean;
  onClose: () => void;
  childId: string;
  childName: string;
}) {
  const [form, setForm] = useState<LinkParentForm>({
    fullName: "",
    email: "",
    relation: "mama",
  });
  const [emailError, setEmailError] = useState(false);
  const [state, setState] = useState<SendState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);

  const firstName = childName.split(" ")[0];
  const sending = state === "sending";
  const sent = state === "sent";
  const busy = sending || sent;

  // Valida formato básico de correo electrónico.
  const isValidEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // El botón CTA solo se activa cuando nombre y email están completos y el email es válido.
  const isFormValid = form.fullName.trim().length > 0 && isValidEmail(form.email);

  // Close with Escape (blocked while the action is in flight).
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, sending]);

  if (!open) return null;

  const handleSend = async () => {
    const nextEmail = form.email.trim();
    if (!form.fullName.trim() || !isValidEmail(nextEmail)) return;
    setState("sending");
    setServerError(null);
    const payload = new FormData();
    payload.set("fullName", form.fullName.trim());
    payload.set("email", nextEmail);
    payload.set("relationship", form.relation);
    const result = await sendParentInvitation(childId, payload);
    if (result.ok) {
      setGeneratedCode(result.code);
      setSentToEmail(nextEmail);
      setState("sent");
    } else {
      setState("idle");
      setServerError(result.error);
    }
  };

  return (
    <>
      {/* Backdrop: click to close (ignored while sending) */}
      <div
        className="fixed inset-0 z-50 bg-[#3f362e]/35 backdrop-blur-sm"
        onClick={sending ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="fixed left-[50%] top-[40px] z-[51] -translate-x-1/2 w-full max-w-[480px] mx-[4px] md:mx-0 rounded-[24px] border border-[#ece0d0] bg-[#fbf4ec] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Vincular padre"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[26px] py-[20px] border-b border-[#ece0d0]">
          <div>
            <span className="font-display font-semibold text-[18px] text-ink block">
              Vincular padre
            </span>
            <span className="text-[13px] text-ink-faint">{`a ${childName}`}</span>
          </div>
          <button
            type="button"
            onClick={sending ? undefined : onClose}
            className="rounded-[10px] bg-[#f0e6d8] p-[1px] text-[#94887b]"
          >
            <CloseIcon size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Body */}
        <div className="px-[26px] pb-[24px] pt-[24px]">
          {/* Aviso de correo */}
          <div className="flex gap-[11px] rounded-[14px] bg-[#e3ecfb] px-[16px] py-[13px] mb-[20px]">
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4e72c8"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-none mt-[1px]"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span className="text-[13.5px] leading-[1.45] text-[#3f5694]">
              Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {firstName}.
            </span>
          </div>

          {/* NOMBRE DEL PADRE/MADRE */}
          <div className="mb-[18px]">
            <label
              className="block mb-[8px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887b]"
            >
              NOMBRE DEL PADRE/MADRE
            </label>
            <input
              type="text"
              placeholder="Ej. Diego Fernández"
              value={form.fullName}
              disabled={busy}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white text-[15px] text-ink disabled:opacity-70"
            />
          </div>

          {/* EMAIL */}
          <div className="mb-[18px]">
            <label
              className="block mb-[8px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887b]"
            >
              EMAIL
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={form.email}
              disabled={busy}
              onChange={(e) => {
                const value = e.target.value;
                setForm({ ...form, email: value });
                // Solo marca error si el usuario escribió algo y no es un email válido.
                setEmailError(value.trim().length > 0 && !isValidEmail(value));
              }}
              className={`w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] bg-white text-[15px] text-ink disabled:opacity-70 ${
                emailError ? "border-[#d9583c]" : "border-[#eadfd0]"
              }`}
            />
            {emailError && !busy && (
              <p className="mt-[4px] text-[12px] font-bold text-[#d9583c]">
                Correo inválido
              </p>
            )}
          </div>

          {/* PARENTESCO */}
          <div className="mb-[20px]">
            <label
              className="block mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887b]"
            >
              PARENTESCO
            </label>
            <div className="flex gap-[9px]">
              {RELATIONS.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  disabled={busy}
                  onClick={() => setForm({ ...form, relation: rel.id })}
                  className={`flex-1 py-[11px] rounded-[999px] font-extrabold text-[14px] transition-colors ${
                    form.relation === rel.id
                      ? "border-[1.5px] border-[#9fb8ec] bg-[#ccd8f4] text-[#4e72c8]"
                      : "border-[1.5px] border-[#ece0d0] bg-[#fffdf9] text-[#6e6359]"
                  } ${busy ? "opacity-70" : "cursor-pointer"}`}
                >
                  {rel.label}
                </button>
              ))}
            </div>
          </div>

          {/* CÓDIGO DE INVITACIÓN: "—" hasta que el envío genera el real */}
          <div
            className="rounded-[16px] border-[1.5px] border-dashed border-[#e6d08a] bg-[#fbf1d6] px-[18px] py-[18px] text-center mb-[20px]"
          >
            <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#a88526] mb-[8px]">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-display font-semibold text-[34px] tracking-[7px] text-[#8a7234]">
              {sent ? generatedCode : "—"}
            </div>
            <div className="mt-[6px] text-[13px] text-[#a88526]">
              {sent ? `Correo enviado a ${sentToEmail}` : "Se genera al enviar"}
            </div>
            {sent && <div className="mt-[2px] text-[13px] text-[#a88526]">Vence en 7 días</div>}
          </div>

          {/* Server error (already localized in Spanish), visible under the block */}
          {serverError && (
            <p className="mb-[14px] text-[13px] font-bold text-[#d9583c]" role="alert">
              {serverError}
            </p>
          )}

          {/* CTA: envía la Server Action; en el estado de éxito "Listo" cierra el modal */}
          <button
            type="button"
            disabled={!sent && (!isFormValid || sending)}
            onClick={sent ? onClose : handleSend}
            className={`flex items-center justify-center gap-[9px] w-full rounded-[14px] px-0 py-[14px] text-[15.5px] font-extrabold shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] ${
              sent || (isFormValid && !sending)
                ? "bg-[linear-gradient(180deg,#f4977e,#ee8164)] text-white cursor-pointer"
                : "bg-[#f0e6d8] text-[#94887b] cursor-not-allowed"
            }`}
          >
            {sent ? (
              "Listo"
            ) : (
              <>
                <svg
                  width={19}
                  height={19}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m22 2-7 20-4-9-9-4z" />
                  <path d="M22 2 11 13" />
                </svg>
                {sending ? "Enviando…" : "Enviar invitación"}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

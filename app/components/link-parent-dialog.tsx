"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "./icons";

type Relation = "mama" | "papa" | "tutor";

type LinkParentForm = {
  fullName: string;   // NOMBRE DEL PADRE/MADRE
  email: string;      // EMAIL
  relation: Relation; // PARENTESCO
};

const INVITATION_CODE = "7K4P9";

const RELATIONS: { id: Relation; label: string }[] = [
  { id: "mama", label: "Mamá" },
  { id: "papa", label: "Papá" },
  { id: "tutor", label: "Tutor/a" },
];

/**
 * "Vincular padre" modal: self-contained client component triggered from the
 * "Vincular otro padre" link on /kids/[childId]. Mirrors
 * references/pantallas/vincular-padre.dc.html pixel-wise.
 * No backend, no routes — mock-only ("solo interfaces" rule).
 *
 * Props:
 *   open    — whether the dialog is visible (owned by the parent page).
 *   onClose — called on X click, backdrop click, or Escape.
 *   childName — full name of the kid (e.g. "Mateo Fernández"), shown in the
 *               header ("Vincular padre a Mateo") and in the notice copy.
 */
export function LinkParentDialog({
  open,
  onClose,
  childName,
}: {
  open: boolean;
  onClose: () => void;
  childName: string;
}) {
  const [form, setForm] = useState<LinkParentForm>({
    fullName: "",
    email: "",
    relation: "mama",
  });

  const firstName = childName.split(" ")[0];

  // Close with Escape.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop: click to close */}
      <div
        className="fixed inset-0 z-50 bg-[#3f362e]/35 backdrop-blur-sm"
        onClick={onClose}
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
            onClick={onClose}
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
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white text-[15px] text-ink"
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
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white text-[15px] text-ink"
            />
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
                  onClick={() => setForm({ ...form, relation: rel.id })}
                  className={`flex-1 py-[11px] rounded-[999px] font-extrabold text-[14px] cursor-pointer transition-colors ${
                    form.relation === rel.id
                      ? "border-[1.5px] border-[#9fb8ec] bg-[#ccd8f4] text-[#4e72c8]"
                      : "border-[1.5px] border-[#ece0d0] bg-[#fffdf9] text-[#6e6359]"
                  }`}
                >
                  {rel.label}
                </button>
              ))}
            </div>
          </div>

          {/* CÓDIGO DE INVITACIÓN (texto fijo, no editable) */}
          <div
            className="rounded-[16px] border-[1.5px] border-dashed border-[#e6d08a] bg-[#fbf1d6] px-[18px] py-[18px] text-center mb-[20px]"
          >
            <div className="text-[12px] font-extrabold tracking-[0.7px] text-[#a88526] mb-[8px]">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-display font-semibold text-[34px] tracking-[7px] text-[#8a7234]">
              {INVITATION_CODE}
            </div>
            <div className="mt-[6px] text-[13px] text-[#a88526]">Vence en 7 días</div>
          </div>

          {/* CTA "Enviar invitación" — placeholder muerto: no navega, no toast, no modifica nada */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              // Placeholder: no action (solo interfaces, sin backend).
            }}
            className="flex items-center justify-center gap-[9px] w-full rounded-[14px] px-0 py-[14px] bg-[linear-gradient(180deg,#f4977e,#ee8164)] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
          >
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
            Enviar invitación
          </button>
        </div>
      </div>
    </>
  );
}

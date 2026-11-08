"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhotoIcon } from "./icons";

type Recipient = {
  id: string;        // "mateo" | "sofia" | "benjamin" | "toda-la-sala"
  label: string;     // "Mateo" | "Sofía" | "Benjamín" | "Toda la sala"
  initials: string;  // "M" | "S" | "B" | undefined
  avatarBg: string;  // color de fondo del avatar circular
  avatarFg: string;  // color de las iniciales del avatar
};

type PostType = {
  id: string;        // "comida" | "siesta" | "actividad" | "logro" | "animo" | "foto" | "anuncio"
  label: string;     // "Comida" | "Siesta" | "Actividad" | "Logro" | "Ánimo" | "Foto" | "Anuncio"
  bg: string;        // color de fondo del chip
  color: string;     // color del texto del chip
};

type NewPostForm = {
  recipients: string[]; // PARA: IDs seleccionados (Mateo por defecto)
  typeId: string | null; // TIPO: ninguno inicialmente
  description: string;  // DESCRIPCIÓN: vacío inicialmente
};

type FormErrors = {
  description?: string;
};

const RECIPIENTS: Recipient[] = [
  { id: "mateo", label: "Mateo", initials: "M", avatarBg: "#A9D9E8", avatarFg: "#1F7A93" },
  { id: "sofia", label: "Sofía", initials: "S", avatarBg: "#F4B8CC", avatarFg: "#C44A7A" },
  { id: "benjamin", label: "Benjamín", initials: "B", avatarBg: "#B9DEC4", avatarFg: "#3E8B62" },
  { id: "toda-la-sala", label: "Toda la sala", initials: "", avatarBg: "", avatarFg: "" },
];

const POST_TYPES: PostType[] = [
  { id: "comida", label: "Comida", bg: "#9A7B1E", color: "#fff" },
  { id: "siesta", label: "Siesta", bg: "#E7DCF6", color: "#7B5FC0" },
  { id: "actividad", label: "Actividad", bg: "#2E89A6", color: "#fff" },
  { id: "logro", label: "Logro", bg: "#CFEBD8", color: "#3E9B6C" },
  { id: "animo", label: "Ánimo", bg: "#F9D2DE", color: "#C56486" },
  { id: "foto", label: "Foto", bg: "#FBD8CC", color: "#D9684A" },
  { id: "anuncio", label: "Anuncio", bg: "#CCD8F4", color: "#4E72C8" },
];

/**
 * "Nueva publicación" modal: self-contained client component triggered from the
 * sidebar CTA. Mirrors references/pantallas/crear-publicacion.dc.html.
 * No backend, no routes — mock-only ("solo interfaces" rule).
 *
 * Props:
 *   open    — whether the dialog is visible (owned by the sidebar).
 *   onClose — called on Cancel click, backdrop click, or Escape.
 */
export function NewPostDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<NewPostForm>({
    recipients: ["mateo"],
    typeId: null,
    description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showToast, setShowToast] = useState(false);

  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const isRecipientSelected = (id: string) => form.recipients.includes(id);

  const toggleRecipient = (id: string) => {
    setForm((prev) => {
      const isWholeRoom = id === "toda-la-sala";
      const isCurrentlySelected = prev.recipients.includes(id);

      // "Toda la sala" es mutuamente excluyente con los niños individuales.
      if (isWholeRoom) {
        if (isCurrentlySelected) {
          // Ya está seleccionada: desmarcarla (quedan los niños individuales, o ninguno).
          return {
            ...prev,
            recipients: prev.recipients.filter((rid) => rid !== "toda-la-sala"),
          };
        }
        // No estaba seleccionada: seleccionar solo "Toda la sala" y desactivar los niños.
        return { ...prev, recipients: ["toda-la-sala"] };
      }

      // Niño individual: quitar "Toda la sala" si estaba seleccionada.
      const withoutWholeRoom = prev.recipients.filter(
        (rid) => rid !== "toda-la-sala"
      );
      if (isCurrentlySelected) {
        return { ...prev, recipients: withoutWholeRoom.filter((rid) => rid !== id) };
      }
      return { ...prev, recipients: [...withoutWholeRoom, id] };
    });
  };

  const selectType = (id: string) => {
    setForm((prev) => ({ ...prev, typeId: id }));
  };

  const resetForm = useCallback(() => {
    setForm({ recipients: ["mateo"], typeId: null, description: "" });
    setErrors({});
    setShowToast(false);
  }, []);

  const handleCancel = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Close with Escape.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleCancel]);

  const validate = (): FormErrors | null => {
    const nextErrors: FormErrors = {};
    if (!form.description.trim()) {
      nextErrors.description = "Campo obligatorio";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0 ? null : nextErrors;
  };

  const handlePublish = () => {
    const nextErrors = validate();
    if (nextErrors) {
      descriptionRef.current?.focus();
      return;
    }
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      resetForm();
      onClose();
    }, 1500);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop: click to close */}
      <div
        className="fixed inset-0 z-50 bg-[#3f362e]/35 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="fixed left-[50%] top-[40px] z-[51] -translate-x-1/2 w-full max-w-[580px] mx-[4px] md:mx-0 rounded-[24px] border border-[#ece0d0] bg-[#fbf4ec] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Nueva publicación"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[26px] py-[20px] border-b border-[#ece0d0]">
          <button type="button" onClick={handleCancel} className="text-[#94887b] font-extrabold text-[15px] cursor-pointer">
            Cancelar
          </button>
          <span className="font-display font-semibold text-[18px] text-ink">Nueva publicación</span>
          <button type="button" onClick={handlePublish} className="text-[#d9583c] font-extrabold text-[15px] cursor-pointer">
            Publicar
          </button>
        </div>

        {/* Body */}
        <div className="px-[26px] pb-[24px] pt-[24px]">
          {/* PARA */}
          <div className="mb-[18px]">
            <label className="block mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887b]">
              PARA
            </label>
            <div className="flex flex-wrap gap-[9px] mb-[22px]">
              {RECIPIENTS.map((recipient) => {
                const selected = isRecipientSelected(recipient.id);
                const hasAvatar = recipient.initials.length > 0;
                return (
                  <button
                    key={recipient.id}
                    type="button"
                    onClick={() => toggleRecipient(recipient.id)}
                    className={`flex items-center gap-[8px] rounded-[999px] border-[1.5px] font-bold text-[14px] cursor-pointer px-[${hasAvatar ? 14 : 16}px] py-[6px] ${
                      selected
                        ? "border-[#3f362e] bg-[#3f362e] text-white"
                        : "border-[#ece0d0] bg-[#fffdf9] text-[#6e6359]"
                    }`}
                  >
                    {hasAvatar && (
                      <span
                        className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full"
                        style={{ backgroundColor: recipient.avatarBg, color: recipient.avatarFg }}
                      >
                        {recipient.initials}
                      </span>
                    )}
                    {recipient.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIPO */}
          <div className="mb-[18px]">
            <label className="block mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887b]">
              TIPO
            </label>
            <div className="flex flex-wrap gap-[9px] mb-[22px]">
              {POST_TYPES.map((type) => {
                const selected = form.typeId === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => selectType(type.id)}
                    className="px-[16px] py-[8px] rounded-[999px] font-extrabold text-[13.5px] cursor-pointer"
                    style={{
                      backgroundColor: type.bg,
                      color: type.color,
                      border: selected ? "1.5px solid #3f362e" : undefined,
                    }}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="mb-[22px]">
            <label className="block mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887b]">
              DESCRIPCIÓN
            </label>
            <textarea
              ref={descriptionRef}
              placeholder="Contá cómo le fue hoy…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full min-h-[120px] resize-vertical px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white text-[15px] text-ink leading-[1.5]"
            />
            {errors.description && (
              <p className="mt-[4px] text-[12px] font-bold text-[#d9583c]">
                {errors.description}
              </p>
            )}
          </div>

          {/* FOTOS */}
          <div className="mb-[22px]">
            <label className="block mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887b]">
              FOTOS
            </label>
            <div className="flex gap-[12px]">
              <div className="flex h-[96px] w-[96px] flex-none items-center justify-center rounded-[14px] border-[1px] border-[#ece0d0] bg-[#f4ece1] text-[#cbb89f]">
                <PhotoIcon size={26} />
              </div>
              <button
                type="button"
                className="flex h-[96px] w-[96px] flex-none flex-col items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed border-[#dbcbda] bg-[#f4ece1] text-[#b0a290] cursor-pointer"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C5503A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-[12px]">Agregar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toast: mock confirmation ("Publicación creada") */}
        {showToast && (
          <div
            className="fixed bottom-[24px] left-[50%] z-[60] -translate-x-1/2 rounded-[14px] bg-[#3f362e] px-[16px] py-[10px] text-[14px] text-white shadow-lg"
            aria-live="polite"
          >
            Publicación creada
          </div>
        )}
      </div>
    </>
  );
}

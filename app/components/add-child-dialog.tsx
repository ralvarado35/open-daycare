"use client";

import { useEffect, useRef, useState } from "react";
import { PlusIcon } from "./icons";

type Room = {
  id: string;      // "soles" | "luna" | "estrellas"
  label: string;   // "Soles" | "Luna" | "Estrellas"
};

type FormData = {
  fullName: string;     // NOMBRE COMPLETO
  birthDate: string;    // FECHA DE NACIMIENTO (dd/mm/aaaa)
  roomId: string;       // SALA
  allergies: string;    // ALERGIAS (ETIQUETAS), opcional
  medicalNotes: string; // NOTAS MÉDICAS, opcional
};

type FormErrors = {
  fullName?: string;
  birthDate?: string;
  roomId?: string;
};

const ROOMS: Room[] = [
  { id: "soles", label: "Soles" },
  { id: "luna", label: "Luna" },
  { id: "estrellas", label: "Estrellas" },
];

/**
 * "Agregar niño" modal: trigger button + dialog panel, self-contained client
 * component. Mirrors references/pantallas/agregar-nino.dc.html pixel-wise.
 * No backend, no routes — mock-only ("solo interfaces" rule).
 */
export function AddChildDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({
    fullName: "",
    birthDate: "",
    roomId: "soles",
    allergies: "",
    medicalNotes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showToast, setShowToast] = useState(false);

  const firstNameRef = useRef<HTMLInputElement>(null);
  const birthDateRef = useRef<HTMLInputElement>(null);
  const roomRef = useRef<HTMLSelectElement>(null);

  // Close with Escape.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const openDialog = () => setOpen(true);

  const closeDialog = () => {
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      fullName: "",
      birthDate: "",
      roomId: "soles",
      allergies: "",
      medicalNotes: "",
    });
    setErrors({});
    setShowToast(false);
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!form.fullName.trim()) {
      nextErrors.fullName = "Campo obligatorio";
    }
    if (!form.birthDate.trim()) {
      nextErrors.birthDate = "Campo obligatorio";
    }
    if (!form.roomId) {
      nextErrors.roomId = "Campo obligatorio";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const focusFirstError = () => {
    if (errors.fullName && firstNameRef.current) {
      firstNameRef.current.focus();
    } else if (errors.birthDate && birthDateRef.current) {
      birthDateRef.current.focus();
    } else if (errors.roomId && roomRef.current) {
      roomRef.current.focus();
    }
  };

  const handleSave = () => {
    if (!validate()) {
      focusFirstError();
      return;
    }
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      closeDialog();
    }, 1500);
  };

  const handleCancel = () => closeDialog();

  if (!open) {
    // Trigger button only (replaces the dead placeholder link in the header).
    return (
      <button
        type="button"
        onClick={openDialog}
        className="flex flex-none items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#f4977e,#ee8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
      >
        <PlusIcon />
        Agregar niño
      </button>
    );
  }

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
        className="fixed left-[50%] top-[40px] z-[51] -translate-x-1/2 w-full max-w-[520px] mx-[4px] md:mx-0 rounded-[24px] border border-[#ece0d0] bg-[#fbf4ec] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Agregar niño"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[26px] py-[20px] border-b border-[#ece0d0]">
          <button
            type="button"
            onClick={handleCancel}
            className="text-[#94887b] font-extrabold text-[15px]"
          >
            Cancelar
          </button>
          <span className="font-display font-semibold text-[18px] text-ink">
            Agregar niño
          </span>
          <button
            type="button"
            onClick={handleSave}
            className="text-[#d9583c] font-extrabold text-[15px]"
          >
            Guardar
          </button>
        </div>

        {/* Body */}
        <div className="px-[26px] pb-[24px] pt-[24px]">
          {/* NOMBRE COMPLETO */}
          <div className="mb-[18px]">
            <label
              className="block mb-[8px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887b]"
            >
              NOMBRE COMPLETO
            </label>
            <input
              ref={firstNameRef}
              type="text"
              placeholder="Ej. Martina López"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white text-[15px] text-ink"
            />
            {errors.fullName && (
              <p className="mt-[4px] text-[12px] font-bold text-[#d9583c]">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* FECHA DE NACIMIENTO + SALA (side by side) */}
          <div className="flex gap-[14px] mb-[18px]">
            <div className="flex-1">
              <label
                className="block mb-[8px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887b]"
              >
                FECHA DE NACIMIENTO
              </label>
              <input
                ref={birthDateRef}
                type="text"
                placeholder="dd/mm/aaaa"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                className="w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white text-[15px] text-ink"
              />
              {errors.birthDate && (
                <p className="mt-[4px] text-[12px] font-bold text-[#d9583c]">
                  {errors.birthDate}
                </p>
              )}
            </div>
            <div className="flex-1">
              <label
                className="block mb-[8px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887b]"
              >
                SALA
              </label>
              <div className="relative">
                <select
                  ref={roomRef}
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  className="w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white text-[15px] text-ink font-semibold appearance-none cursor-pointer"
                >
                  {ROOMS.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-[16px] top-[1/2] -translate-y-[1/2] w-[16px] h-[16px] pointer-events-none text-[#b0a290]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B0A290"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {errors.roomId && (
                <p className="mt-[4px] text-[12px] font-bold text-[#d9583c]">
                  {errors.roomId}
                </p>
              )}
            </div>
          </div>

          {/* ALERGIAS (ETIQUETAS) */}
          <div className="mb-[18px]">
            <label
              className="block mb-[8px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887b]"
            >
              ALERGIAS (ETIQUETAS)
            </label>
            <input
              type="text"
              placeholder="Ej. Maní, Lactosa"
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              className="w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white text-[15px] text-ink"
            />
          </div>

          {/* NOTAS MÉDICAS */}
          <div className="mb-[18px]">
            <label
              className="block mb-[8px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887b]"
            >
              NOTAS MÉDICAS
            </label>
            <textarea
              placeholder="Indicaciones, medicación, contactos…"
              value={form.medicalNotes}
              onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })}
              className="w-full min-h-[90px] resize-vertical px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white text-[15px] text-ink leading-[1.5]"
            />
          </div>
        </div>

        {/* Toast: mock confirmation ("Niño agregado") */}
        {showToast && (
          <div
            className="fixed bottom-[24px] left-[50%] z-[60] -translate-x-1/2 rounded-[14px] bg-[#3f362e] px-[16px] py-[10px] text-[14px] text-white shadow-lg"
            aria-live="polite"
          >
            Niño agregado
          </div>
        )}
      </div>
    </>
  );
}

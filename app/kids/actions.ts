"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  birthDateInputToIso,
  getStaffDaycareId,
  listRooms,
  parseAllergyInput,
} from "@/lib/children";

export type AddChildResult = {
  // Spanish UI message rendered inside the modal when the insert is rejected.
  // Undefined means success.
  error?: string;
};

/**
 * Server Action behind the "Agregar niño" modal: revalidates the fields the
 * dialog already checks client-side (defense in depth), verifies the selected
 * room belongs to the staff user's daycare, inserts into `children` and
 * revalidates /kids so the new card appears without a manual reload.
 *
 * `enrolled_at`, `status` and `photo_consent` are not sent: the columns use
 * their SQL defaults (CURRENT_DATE / 'active' / true), as agreed in SPEC 09.
 */
export async function addChild(formData: FormData): Promise<AddChildResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const birthDateInput = String(formData.get("birthDate") ?? "").trim();
  const roomId = String(formData.get("roomId") ?? "").trim();
  const allergiesInput = String(formData.get("allergies") ?? "");
  const medicalNotes = String(formData.get("medicalNotes") ?? "").trim();

  if (!fullName) {
    return { error: "El nombre completo es obligatorio." };
  }

  // dd/mm/aaaa → yyyy-mm-dd; rejects impossible dates (31/04, 29/02 non-leap…).
  const birthDate = birthDateInputToIso(birthDateInput);
  if (!birthDate) {
    return { error: "La fecha de nacimiento debe ser una fecha real en formato dd/mm/aaaa." };
  }
  const birthYear = Number(birthDate.slice(0, 4));
  if (birthYear < 1900 || birthYear > new Date().getFullYear()) {
    return { error: "El año de nacimiento no es válido." };
  }

  if (!roomId) {
    return { error: "La sala es obligatoria." };
  }

  // The room must belong to the staff user's own daycare (mirrors the RLS
  // insert policy; the friendly message comes from here).
  const daycareId = await getStaffDaycareId();
  if (!daycareId) {
    return { error: "Tu sesión no tiene una guardería de staff asociada." };
  }
  const rooms = await listRooms(daycareId);
  if (!rooms.some((room) => room.id === roomId)) {
    return { error: "La sala seleccionada no existe en tu guardería." };
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.from("children").insert({
    room_id: roomId,
    full_name: fullName,
    birth_date: birthDate,
    allergy_tags: parseAllergyInput(allergiesInput),
    medical_notes: medicalNotes.length > 0 ? medicalNotes : null,
  });

  if (error) {
    return { error: "No se pudo guardar el niño. Intentá nuevamente." };
  }

  revalidatePath("/kids");
  return {};
}

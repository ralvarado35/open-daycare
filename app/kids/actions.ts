"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  birthDateInputToIso,
  getChildById,
  getStaffDaycareId,
  listRooms,
  parseAllergyInput,
} from "@/lib/children";
import { getCurrentUser } from "@/lib/auth";
import { createInvitation, type Relation, type SendInvitationResult } from "@/lib/invitations";
import { sendInvitationEmail } from "@/lib/invitation-email";

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

// Same basic shape check the dialog runs client-side (defense in depth).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_RELATIONS: readonly Relation[] = ["mama", "papa", "tutor"];

function parseRelation(value: FormDataEntryValue | null): Relation | null {
  const raw = String(value ?? "");
  return (ALLOWED_RELATIONS as readonly string[]).includes(raw) ? (raw as Relation) : null;
}

/**
 * Server Action behind the "Vincular padre" modal CTA (SPEC 08): re-validates
 * the fields the dialog already checks client-side (defense in depth), resolves
 * the child through RLS (getChildById is null for malformed ids, unknown kids
 * and kids outside the staff daycare), stores the pending invitation and sends
 * the activation email. If Resend rejects the send, the freshly created
 * invitation is cancelled so no pending row dangles, and the Spanish email
 * error is returned for the modal to display. Success returns the generated
 * code for the modal's success state.
 */
export async function sendParentInvitation(
  childId: string,
  formData: FormData,
): Promise<SendInvitationResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const relationship = parseRelation(formData.get("relationship"));

  if (!fullName) {
    return { ok: false, error: "El nombre del padre o madre es obligatorio." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "El correo ingresado no es válido." };
  }
  if (!relationship) {
    return { ok: false, error: "Seleccioná el parentesco: Mamá, Papá o Tutor/a." };
  }

  const kid = await getChildById(childId);
  if (!kid) {
    return { ok: false, error: "El niño seleccionado no existe en tu guardería." };
  }

  const staff = await getCurrentUser();
  if (!staff) {
    return { ok: false, error: "Tu sesión expiró. Recargá la página e intentá nuevamente." };
  }

  const invitation = await createInvitation({
    childId,
    invitedBy: staff.id,
    fullName,
    email,
    relationship,
  });
  if (!invitation) {
    return { ok: false, error: "No se pudo crear la invitación. Intentá nuevamente." };
  }

  const emailResult = await sendInvitationEmail({
    invitation,
    childName: `${kid.firstName} ${kid.lastName}`.trim(),
  });
  if (!emailResult.ok) {
    // Leave no orphan pendings: the modal surfaces the error and the staff
    // simply retries (createInvitation would cancel this row anyway).
    const supabase = createClient(await cookies());
    const { error: cancelError } = await supabase
      .from("invitations")
      .update({ status: "cancelled" })
      .eq("id", invitation.id);
    if (cancelError) {
      console.error("sendParentInvitation: could not cancel failed invitation:", cancelError);
    }
    return { ok: false, error: emailResult.error };
  }

  return { ok: true, code: invitation.code };
}

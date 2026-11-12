"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { lookupInvitation } from "@/lib/invitations";

/**
 * Server Action behind the "Activar mi cuenta" form (SPEC 08). Validates the
 * invitation code anonymously through the SECURITY DEFINER `lookup_invitation`
 * RPC, registers the parent in Supabase Auth (`role: "parent"` + `full_name`
 * metadata; the `handle_new_user` trigger from migration 0002 creates the
 * `users` row) and finalizes the link through `accept_invitation`, which runs
 * with the brand-new session (`auth.uid()`). Then redirects to the login with
 * a success flag. Everything user-visible is Spanish; internal code is English.
 */

export type ActivateAccountResult = { ok: true } | { ok: false; error: string };

const INVALID_CODE_ERROR = "El código de invitación no es válido o venció.";

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

export async function activateAccount(formData: FormData): Promise<ActivateAccountResult> {
  const code = normalizeCode(String(formData.get("code") ?? ""));
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (code.length === 0) {
    return { ok: false, error: "El código de invitación es obligatorio." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "El correo ingresado no es válido." };
  }
  if (password.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const supabase = createClient(await cookies());

  // Anonymous validation: only the RPC can read the invitation pre-login.
  const invitation = await lookupInvitation(code);
  const emailMatches =
    !!invitation && invitation.email.trim().toLowerCase() === email.toLowerCase();
  // Same message for every failure: pre-login must not leak which part missed.
  if (!invitation || invitation.statusDerivado !== "pending" || !emailMatches) {
    return { ok: false, error: INVALID_CODE_ERROR };
  }

  // Register the parent. Metadata drives role/`users` creation via trigger 0002.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: "parent", full_name: invitation.fullName },
    },
  });

  if (signUpError) {
    console.error("activateAccount: signUp failed:", signUpError.message, signUpError.status);
    if (signUpError.message.toLowerCase().includes("user already registered")) {
      return { ok: false, error: "Ese correo ya tiene una cuenta. Iniciá sesión." };
    }
    return { ok: false, error: "No se pudo crear la cuenta. Intentá nuevamente." };
  }

  // With "Confirm email" enabled the signUp returns no session: the account
  // exists but activation cannot complete in this pass. Guide the user instead
  // of pretending success (documented dashboard step disables this flow-wide).
  if (!signUpData.session) {
    return {
      ok: false,
      error:
        "Supabase está pidiendo confirmar el email antes de iniciar sesión. Confirmá desde tu casilla (o desactivá 'Confirm email') e intentá de nuevo.",
    };
  }

  // Accept the invitation with the brand-new session (auth.uid() = parent id).
  const { error: acceptError } = await supabase.rpc("accept_invitation", {
    p_code: code,
    p_email: email,
  });

  if (acceptError) {
    const raw = acceptError.message;
    if (raw.includes("invalid_or_expired")) {
      return { ok: false, error: INVALID_CODE_ERROR };
    }
    if (raw.includes("email_mismatch")) {
      return { ok: false, error: INVALID_CODE_ERROR };
    }
    if (raw.includes("already_linked")) {
      return { ok: false, error: "Esa invitación ya fue aceptada con tu cuenta." };
    }
    return { ok: false, error: "No se pudo completar la activación. Intentá nuevamente." };
  }

  // Close the brand-new session on purpose: the proxy sends logged-in
  // visitors away from /login (SPEC 07), and the acceptance flow wants the
  // parent to see the success banner and sign in with the fresh credentials.
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login?activated=1");
}

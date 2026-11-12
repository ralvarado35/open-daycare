import { cacheLife } from "next/cache";
import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/**
 * Server-side data access for parent invitations (SPEC 08). Internal code in
 * English; Spanish only inside data the UI renders. Imported exclusively from
 * Server Actions: this module reads the staff session through `next/headers`
 * and must never reach the client bundle.
 */

// Dialog option (Spanish labels) → `relationship_type` enum value.
export type Relation = "mama" | "papa" | "tutor";

const RELATION_TO_ENUM: Record<Relation, "mother" | "father" | "guardian"> = {
  mama: "mother",
  papa: "father",
  tutor: "guardian",
};

export type InvitationRow = {
  id: string;
  child_id: string;
  invited_by: string;
  full_name: string;
  email: string;
  // `relationship_type` enum value as stored: mother | father | guardian.
  relationship: string;
  code: string;
  // `invitation_status` enum value as stored.
  status: "pending" | "accepted" | "expired" | "cancelled";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

// Result contract of the whole send flow (SPEC 08 data model). The modal
// renders `error` verbatim, or the generated `code` in its success state.
export type SendInvitationResult = { ok: true; code: string } | { ok: false; error: string };

// 5 chars out of 32 unambiguous symbols (0/1/I/O excluded), same shape as the
// SPEC 05 mock `7K4P9`. crypto.randomInt is CSPRNG-backed; collisions are
// handled by retrying the insert on UNIQUE violations.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;
const CODE_INSERT_ATTEMPTS = 5;
const INVITATION_EXPIRATION_DAYS = 7;
// SQLSTATE for unique_violation returned by PostgREST.
const UNIQUE_VIOLATION = "23505";

function generateInvitationCode(): string {
  let code = "";
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET.charAt(randomInt(CODE_ALPHABET.length));
  }
  return code;
}

/**
 * Creates a `pending` invitation and returns its full row, or null when the
 * database rejected the insert for reasons other than a code collision.
 * Previous pending invitations for the same child+email are cancelled first,
 * so re-inviting never leaves duplicate pendings alive. The code is retried up
 * to CODE_INSERT_ATTEMPTS times on UNIQUE collisions with a fresh random draw.
 */
export async function createInvitation(params: {
  childId: string;
  invitedBy: string;
  fullName: string;
  email: string;
  relationship: Relation;
}): Promise<InvitationRow | null> {
  const supabase = createClient(await cookies());
  const email = params.email.trim();
  const emailLower = email.toLowerCase();

  // Best-effort cleanup (a failure here doesn't block a brand-new invitation).
  // PostgREST no longer supports `lower(email)` filter expressions — the
  // `lower(...)` transform was removed from the client and the REST layer —
  // so pending invitations of this child are resolved and compared case-
  // insensitively in TypeScript before cancelling them by id.
  const { data: pendingRows } = await supabase
    .from("invitations")
    .select("id, email")
    .eq("child_id", params.childId)
    .eq("status", "pending");

  const staleIds = (pendingRows ?? [])
    .filter((row) => String(row.email).trim().toLowerCase() === emailLower)
    .map((row) => String(row.id));

  if (staleIds.length > 0) {
    await supabase.from("invitations").update({ status: "cancelled" }).in("id", staleIds);
  }

  const expiresAt = new Date(
    Date.now() + INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  for (let attempt = 0; attempt < CODE_INSERT_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabase
      .from("invitations")
      .insert({
        child_id: params.childId,
        invited_by: params.invitedBy,
        full_name: params.fullName.trim(),
        email,
        relationship: RELATION_TO_ENUM[params.relationship],
        code: generateInvitationCode(),
        status: "pending",
        expires_at: expiresAt,
      })
      .select()
      .maybeSingle();

    if (!error && data) return data as InvitationRow;
    // Only code collisions justify a retry with a brand-new code.
    if (error?.code !== UNIQUE_VIOLATION) return null;
  }

  return null;
}

// Minimal payload published by public.lookup_invitation (SECURITY DEFINER,
// anon-callable). Deliberately excludes ids and invited_by: /activate-account
// is pre-login and only needs to greet the family and show the kid's card.
export type InvitationLookup = {
  childFirstName: string;
  childRoomName: string;
  fullName: string;
  relationship: string;
  email: string;
  // Server-derived: a pending past expires_at already reads as 'expired'.
  statusDerivado: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
};

/**
 * Anonymous invitation lookup by code for the pre-login activation flow.
 * Resolves to null for unknown codes or RPC errors. Scoped with
 * `'use cache: private'` because the Supabase server client reads `cookies()`
 * (cacheComponents rule, same pattern as lib/children.ts).
 */
export async function lookupInvitation(code: string): Promise<InvitationLookup | null> {
  "use cache: private";
  cacheLife({ stale: 0 });

  const supabase = createClient(await cookies());

  const { data, error } = await supabase.rpc("lookup_invitation", { p_code: code });
  if (error) console.error("lookupInvitation RPC error:", error.code, error.message);
  if (error || !data) return null;
  return data as unknown as InvitationLookup;
}

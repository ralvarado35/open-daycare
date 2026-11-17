import { cacheLife } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/**
 * Server-side data access for the "PADRES VINCULADOS" panel (SPEC 09).
 * Internal code in English; every Spanish string here is a user-visible UI
 * label. Scoped with `'use cache: private'` because the Supabase server client
 * reads `cookies()` (cacheComponents rule, same pattern as lib/children.ts).
 */

// View model consumed by <LinkedParentRow> (structurally identical to its
// `Parent` type: the component owns the chips, the data owns the labels).
export type LinkedParentView = {
  // parent_children.id or invitations.id (stable React key).
  id: string;
  // Single letter rendered inside the avatar circle ("L").
  initials: string;
  // Row-index palette color from the reference comp (no real photos).
  avatarBg: string;
  // "Lucía Fernández" (users.full_name or invitations.full_name).
  name: string;
  // "Mamá · activa" | "Papá" | "Papá · invitación enviada".
  relationLabel: string;
  // Chip rendered by the row: ACTIVA or PENDIENTE.
  status: "active" | "pending";
};

type LinkedParentRow = {
  id: string;
  relationship: string;
  // PostgREST returns a to-one embed as an object; the generated types model
  // it as an array, so both shapes are normalized before use.
  users: { full_name: string; status: string }[] | { full_name: string; status: string } | null;
};

type PendingInvitationRow = {
  id: string;
  full_name: string;
  relationship: string;
};

// `relationship_type` enum value → Spanish UI label (same mapping SPEC 08
// uses for the modal options). Unknown values fall back to "Tutor/a".
const RELATIONSHIP_TO_LABEL: Record<string, string> = {
  mother: "Mamá",
  father: "Papá",
  guardian: "Tutor/a",
};

// Avatar colors per row index, as in the reference comp
// (references/pantallas/perfil-nino.dc.html): white initials on pastel circles.
const ROW_AVATAR_PALETTE = ["#C9B6E8", "#A9C7E8", "#F4B8CC", "#B9DEC4", "#F4DC8E"];

function relationshipLabel(relationship: string): string {
  return RELATIONSHIP_TO_LABEL[relationship] ?? "Tutor/a";
}

function nameInitial(fullName: string): string {
  return fullName.trim().charAt(0).toUpperCase();
}

/**
 * Rows of the "PADRES VINCULADOS" panel for one child, in the comp's order:
 * accepted links first (parent_children joined to users), then still-valid
 * pending invitations. Expired, cancelled and accepted invitations are
 * filtered out by the query itself (`expires_at > now()`). Query errors leave
 * the panel empty (`[]` with console.error) instead of breaking the profile.
 */
export async function getLinkedParents(childId: string): Promise<LinkedParentView[]> {
  "use cache: private";
  cacheLife({ stale: 0 });

  const supabase = createClient(await cookies());

  const [linksResult, invitationsResult] = await Promise.all([
    supabase
      .from("parent_children")
      .select("id, relationship, users ( full_name, status )")
      .eq("child_id", childId)
      .order("created_at", { ascending: true }),
    supabase
      .from("invitations")
      .select("id, full_name, relationship")
      .eq("child_id", childId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true }),
  ]);

  if (linksResult.error) {
    console.error("getLinkedParents: parent_children query failed:", linksResult.error.message);
  }
  if (invitationsResult.error) {
    console.error("getLinkedParents: invitations query failed:", invitationsResult.error.message);
  }

  const accepted: LinkedParentView[] = ((linksResult.data ?? []) as unknown as LinkedParentRow[])
    .filter((row) => row.users !== null)
    .map((row, index) => {
      const user = Array.isArray(row.users) ? (row.users[0] ?? null) : row.users;
      const relation = relationshipLabel(row.relationship);
      // Chip ACTIVA (and the "· activa" suffix) is reserved for accounts that
      // actually activated; a still-pending parent account renders PENDIENTE.
      const isActive = user?.status === "active";
      return {
        id: row.id,
        initials: nameInitial(user?.full_name ?? ""),
        avatarBg: ROW_AVATAR_PALETTE[index % ROW_AVATAR_PALETTE.length],
        name: user?.full_name ?? "",
        relationLabel: isActive ? `${relation} · activa` : relation,
        status: isActive ? "active" : "pending",
      };
    });

  const pending: LinkedParentView[] = ((invitationsResult.data ?? []) as PendingInvitationRow[])
    .filter((row) => row.full_name.trim().length > 0)
    .map((row, index) => ({
      id: row.id,
      initials: nameInitial(row.full_name),
      // The palette keeps cycling across the merged row list, as in the comp.
      avatarBg:
        ROW_AVATAR_PALETTE[(accepted.length + index) % ROW_AVATAR_PALETTE.length],
      name: row.full_name,
      relationLabel: `${relationshipLabel(row.relationship)} · invitación enviada`,
      status: "pending" as const,
    }));

  return [...accepted, ...pending];
}

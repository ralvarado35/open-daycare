import { cacheLife } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/**
 * Server-side data access for rooms and children (SPEC 09). Internal code in
 * English; every Spanish string here is a user-visible UI label.
 *
 * Under `cacheComponents: true` every function that reads `cookies()` is
 * scoped with `'use cache: private'` (same pattern as lib/auth.ts): results
 * never persist on the server, so a Server Action re-render always recomputes
 * them with the current session.
 */

export type RoomView = {
  id: string;
  // Room name as stored: "Soles" | "Luna" | "Estrellas".
  label: string;
};

export type ChildView = {
  // children.id (uuid) → URL segment /kids/{uuid}.
  id: string;
  firstName: string;
  // Remainder of full_name; may be "" — components fall back to firstName's initial.
  lastName: string;
  // Spanish UI label: "3 años".
  ageLabel: string;
  // Spanish UI label: fixed "sin padres vinculados" until the parent_children spec.
  parentsLinkedLabel: string;
  avatarBg: string;
  avatarFg: string;
  // Spanish UI label rendered as the pill badge: "MANÍ" | "LACTOSA". Only from allergy_tags.
  allergyTag?: string;
  // Spanish UI label: "12 mar 2022".
  birthDateLabel: string;
  // Spanish UI label: "Soles".
  roomLabel: string;
  // Spanish UI label: "feb 2025".
  enrolledLabel: string;
  // Spanish UI text of the red "Alergias y notas" banner. Omitted when absent.
  allergyNotice?: string;
};

export type RoomWithChildren = RoomView & {
  children: ChildView[];
};

type ChildRow = {
  id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[] | null;
  status: string;
  created_at: string;
};

type RoomRow = {
  id: string;
  name: string;
  created_at: string;
  children: ChildRow[] | null;
};

type ChildWithRoomRow = ChildRow & {
  rooms: { name: string } | null;
};

const CHILD_SELECT =
  "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, status, created_at";

// UI (Spanish, free text from the modal) → DB (English tags, per @db-schema note).
const ALLERGY_INPUT_TO_TAG: Record<string, string> = {
  mani: "peanut",
  lactosa: "lactose",
  gluten: "gluten",
};

// DB tag → UI pill badge label. Unknown tags fall back to uppercase passthrough.
const ALLERGY_TAG_TO_LABEL: Record<string, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
  gluten: "GLUTEN",
};

// Avatar {bg, fg} pairs from the SPEC 02 palette (references/pantallas/ninos.dc.html).
const AVATAR_PALETTE: ReadonlyArray<{ bg: string; fg: string }> = [
  { bg: "#A9D9E8", fg: "#1F7A93" },
  { bg: "#C9B6E8", fg: "#7B5FC0" },
  { bg: "#F4B8CC", fg: "#C44A7A" },
  { bg: "#B9DEC4", fg: "#3E8B62" },
  { bg: "#F4DC8E", fg: "#9A7B1E" },
];

const MONTHS_SHORT_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

// Date-only ISO strings (yyyy-mm-dd) are parsed component-wise to avoid the
// UTC-vs-local shift that `new Date("yyyy-mm-dd")` causes in labels.
function parseIsoDateParts(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function isRealCalendarDate(year: number, month: number, day: number): boolean {
  // Date.UTC round-trip rejects impossible days (31/04, 29/02 on non-leap years…).
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

// "12 mar 2022" from children.birth_date. Falls back to the raw value if malformed.
export function formatBirthDateLabel(isoDate: string): string {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) return isoDate;
  return `${parts.day} ${MONTHS_SHORT_ES[parts.month - 1]} ${parts.year}`;
}

// "feb 2025" from children.enrolled_at.
export function formatEnrolledLabel(isoDate: string): string {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) return isoDate;
  return `${MONTHS_SHORT_ES[parts.month - 1]} ${parts.year}`;
}

// Whole years since birth, floor: "3 años" | "1 año".
export function computeAgeLabel(birthIsoDate: string): string {
  const parts = parseIsoDateParts(birthIsoDate);
  if (!parts) return "";
  const today = new Date();
  let years = today.getFullYear() - parts.year;
  const birthdayNotReachedYet =
    today.getMonth() + 1 < parts.month ||
    (today.getMonth() + 1 === parts.month && today.getDate() < parts.day);
  if (birthdayNotReachedYet) years -= 1;
  years = Math.max(0, years);
  return years === 1 ? "1 año" : `${years} años`;
}

// "Mateo Fernández" → { firstName: "Mateo", lastName: "Fernández" }.
// Single-token names leave lastName empty (avatar then uses the name's initial).
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const tokens = fullName.trim().split(/\s+/);
  return { firstName: tokens[0] ?? "", lastName: tokens.slice(1).join(" ") };
}

function hashString(value: string): number {
  // Stable FNV-1a-like hash: same uuid always maps to the same avatar pair.
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

export function avatarPaletteFor(id: string): { avatarBg: string; avatarFg: string } {
  const pair = AVATAR_PALETTE[hashString(id) % AVATAR_PALETTE.length];
  return { avatarBg: pair.bg, avatarFg: pair.fg };
}

export function allergyTagLabel(tag: string): string {
  const label = ALLERGY_TAG_TO_LABEL[tag.toLowerCase()];
  return label ?? tag.toUpperCase();
}

// Modal free-text ("maní, lactosa") → English tags for children.allergy_tags.
// Unknown terms are stored as lowercase passthrough; duplicates are dropped.
export function parseAllergyInput(input: string): string[] {
  const tags = input
    .split(",")
    .map((term) =>
      term
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    )
    .filter((term) => term.length > 0)
    .map((term) => ALLERGY_INPUT_TO_TAG[term] ?? term);
  return Array.from(new Set(tags));
}

// Modal masked date "dd/mm/aaaa" → ISO "yyyy-mm-dd". Null when the date is
// impossible (bad order, 31/04, 29/02 on non-leap years…).
export function birthDateInputToIso(input: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!isRealCalendarDate(year, month, day)) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function mapChildToView(row: ChildRow, roomLabel: string): ChildView {
  const { firstName, lastName } = splitFullName(row.full_name);
  const firstTag = row.allergy_tags?.[0];
  const view: ChildView = {
    id: row.id,
    firstName,
    lastName,
    ageLabel: computeAgeLabel(row.birth_date),
    parentsLinkedLabel: "sin padres vinculados",
    ...avatarPaletteFor(row.id),
    birthDateLabel: formatBirthDateLabel(row.birth_date),
    roomLabel,
    enrolledLabel: formatEnrolledLabel(row.enrolled_at),
  };
  if (firstTag) {
    view.allergyTag = allergyTagLabel(firstTag);
  }
  const notice = row.medical_notes?.trim();
  if (notice) {
    view.allergyNotice = notice;
  }
  return view;
}

async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

/**
 * Daycare of the logged-in staff user (own row in `users`). Null when there is
 * no session or the user is not staff — callers render the empty state.
 */
export async function getStaffDaycareId(): Promise<string | null> {
  "use cache: private";
  cacheLife({ stale: 300 });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("daycare_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "staff") return null;
  return profile.daycare_id ?? null;
}

/**
 * Rooms of a daycare ordered by created_at (Soles → Luna → Estrellas), each
 * with its active children. The `children` embed respects children RLS, so
 * staff only ever receive rows from their own daycare.
 */
export async function listRoomsWithChildren(daycareId: string): Promise<RoomWithChildren[]> {
  "use cache: private";
  cacheLife({ stale: 0 });

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("rooms")
    .select(`id, name, created_at, children ( ${CHILD_SELECT} )`)
    .eq("daycare_id", daycareId)
    .eq("children.status", "active")
    .order("created_at", { ascending: true })
    .order("created_at", { ascending: true, foreignTable: "children" });

  const rows = (data ?? []) as unknown as RoomRow[];
  return rows.map((room) => ({
    id: room.id,
    label: room.name,
    children: (room.children ?? []).map((child) => mapChildToView(child, room.name)),
  }));
}

/**
 * Single child by uuid with its room name. Null for unknown or malformed ids
 * (the route turns that into notFound()).
 */
export async function getChildById(childId: string): Promise<ChildView | null> {
  "use cache: private";
  cacheLife({ stale: 0 });

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("children")
    .select(`${CHILD_SELECT}, rooms(name)`)
    .eq("id", childId)
    .maybeSingle();

  const row = data as ChildWithRoomRow | null;
  if (!row) return null;
  return mapChildToView(row, row.rooms?.name ?? "");
}

/**
 * Room options for the "Agregar niño" modal select, ordered by created_at.
 */
export async function listRooms(daycareId: string): Promise<RoomView[]> {
  "use cache: private";
  cacheLife({ stale: 0 });

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("daycare_id", daycareId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as { id: string; name: string }[]).map((room) => ({
    id: room.id,
    label: room.name,
  }));
}

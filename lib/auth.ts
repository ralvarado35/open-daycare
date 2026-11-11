import { cacheLife } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type CurrentUserProfile = {
  id: string;
  fullName: string;
  initial: string;
  subtitle: string;
};

const roleLabels: Record<string, string> = {
  staff: "Staff",
  parent: "Familia",
  admin: "Admin",
};

function extractDaycareName(daycares: unknown): string | null {
  if (!daycares) return null;
  const record = Array.isArray(daycares) ? daycares[0] : daycares;
  if (
    record &&
    typeof record === "object" &&
    "name" in record &&
    typeof record.name === "string"
  ) {
    return record.name.replace(/^Guardería\s+/i, "").trim() || record.name;
  }
  return null;
}

/**
 * Fetches the authenticated user's display profile for the sidebar and nav chrome.
 * Scoped with `'use cache: private'` so `cookies()` works inside a `<Suspense>`
 * boundary under `cacheComponents: true` without blocking the static shell.
 */
export async function getCurrentUser(): Promise<CurrentUserProfile | null> {
  "use cache: private";
  cacheLife({ stale: 300 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role, daycares(name)")
    .eq("id", user.id)
    .maybeSingle();

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const emailName = user.email?.split("@")[0]?.trim() ?? "";
  const fullName = profile?.full_name?.trim() || metadataName || emailName || "Usuario";

  const initial = fullName.charAt(0).toUpperCase() || "U";

  const rawRole =
    profile?.role ??
    (typeof user.user_metadata?.role === "string" ? user.user_metadata.role : "staff");
  const roleLabel = roleLabels[rawRole] ?? "Usuario";

  const daycareName = extractDaycareName(profile?.daycares);
  const subtitle = daycareName ? `${roleLabel} · ${daycareName}` : roleLabel;

  return {
    id: user.id,
    fullName,
    initial,
    subtitle,
  };
}

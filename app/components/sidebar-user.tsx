import { getCurrentUser } from "@/lib/auth";

/**
 * Renders the authenticated user's avatar initial, full name, and role/daycare
 * subtitle inside the sidebar footer. Runs behind a `<Suspense>` boundary.
 */
export async function SidebarUserInfo() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#f2937a] font-display text-[16px] font-semibold text-white"
      >
        {user.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold text-ink" title={user.fullName}>
          {user.fullName}
        </div>
        <div className="truncate text-xs text-ink-faint" title={user.subtitle}>
          {user.subtitle}
        </div>
      </div>
    </>
  );
}

/** Loading placeholder matching SidebarUserInfo dimensions to avoid layout shift. */
export function SidebarUserFallback() {
  return (
    <>
      <div className="h-[38px] w-[38px] flex-none rounded-full bg-cream" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3.5 w-24 rounded bg-cream" />
        <div className="h-3 w-16 rounded bg-cream" />
      </div>
    </>
  );
}

/** Renders the authenticated user's initial avatar in the mobile top bar. */
export async function MobileUserAvatar() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div
      aria-label={user.fullName}
      title={user.fullName}
      className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#f2937a] font-display text-[15px] font-semibold text-white"
    >
      {user.initial}
    </div>
  );
}

/** Loading placeholder for the mobile top bar avatar. */
export function MobileUserAvatarFallback() {
  return <div className="h-9 w-9 flex-none rounded-full bg-cream" />;
}


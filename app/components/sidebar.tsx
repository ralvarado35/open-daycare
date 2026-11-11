import { Suspense } from "react";
import type { NavKey } from "@/lib/nav";
import { SidebarContent } from "./sidebar-content";
import { SidebarUserFallback, SidebarUserInfo } from "./sidebar-user";

export { SidebarContent };

/** Desktop sidebar. Hidden below the md breakpoint (768px). */
export function Sidebar({ active }: { active: NavKey }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-line bg-card px-4 py-6 md:flex">
      <SidebarContent
        active={active}
        userSlot={
          <Suspense fallback={<SidebarUserFallback />}>
            <SidebarUserInfo />
          </Suspense>
        }
      />
    </aside>
  );
}

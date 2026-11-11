import { Suspense } from "react";
import type { NavKey } from "@/lib/nav";
import { MobileNavClient } from "./mobile-nav-client";
import {
  MobileUserAvatar,
  MobileUserAvatarFallback,
  SidebarUserFallback,
  SidebarUserInfo,
} from "./sidebar-user";

type MobileNavProps = {
  active: NavKey;
};

/** Mobile chrome (<768px): mini top bar, floating "new post" button and drawer. */
export function MobileNav({ active }: MobileNavProps) {
  return (
    <MobileNavClient
      active={active}
      mobileAvatarSlot={
        <Suspense fallback={<MobileUserAvatarFallback />}>
          <MobileUserAvatar />
        </Suspense>
      }
      drawerUserSlot={
        <Suspense fallback={<SidebarUserFallback />}>
          <SidebarUserInfo />
        </Suspense>
      }
    />
  );
}

import type { ComponentType } from "react";
import Link from "next/link";
import type { NavKey } from "@/lib/nav";
import { logoutHref, navItems, newPostHref } from "@/lib/nav";
import type { IconProps } from "./icons";
import {
  AccountIcon,
  ChildrenIcon,
  CloseIcon,
  FeedIcon,
  LogoutIcon,
  NoticesIcon,
  PlusIcon,
  SunIcon,
} from "./icons";

// Presentation mapping: each nav entry gets its icon from the reference comps.
const navIcons: Record<NavKey, ComponentType<IconProps>> = {
  feed: FeedIcon,
  children: ChildrenIcon,
  notices: NoticesIcon,
  account: AccountIcon,
};

type SidebarContentProps = {
  active: NavKey;
  /** Called when any link is activated (used by the mobile drawer to close itself). */
  onNavigate?: () => void;
  /** Renders the close button in the logo row (mobile drawer only). */
  onClose?: () => void;
};

/**
 * Shared sidebar body (logo, new post CTA, nav, user card). Rendered inside the
 * desktop <Sidebar> and inside the mobile drawer.
 */
export function SidebarContent({ active, onNavigate, onClose }: SidebarContentProps) {
  return (
    <>
      <div className="flex items-center gap-[11px] px-2 pb-[22px] pt-1">
        <Link href="/" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-[11px]">
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-[linear-gradient(155deg,#f8c3a8,#f2937a)] text-white">
            <SunIcon size={21} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-[17px] font-semibold leading-none text-ink">
              OpenDayCare
            </div>
            <div className="mt-[2px] text-[11.5px] text-ink-faint">Sala Soles</div>
          </div>
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="ml-auto flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-cream text-ink-soft"
          >
            <CloseIcon size={18} />
          </button>
        ) : null}
      </div>

      <a
        href={newPostHref}
        onClick={onNavigate}
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#f4977e,#ee8164)] p-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]"
      >
        <PlusIcon size={17} />
        Nueva publicación
      </a>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = item.key === active;
          const ItemIcon = navIcons[item.key];
          return (
            <a
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-[12px] px-3 py-[11px] text-[14.5px] ${
                isActive
                  ? "bg-accent-soft font-extrabold text-accent-dark"
                  : "font-semibold text-ink-muted"
              }`}
            >
              <ItemIcon size={19} />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-2.5 border-t border-line pt-[14px]">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#f2937a] font-display text-[16px] font-semibold text-white">
            C
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-ink">Caro Giménez</div>
            <div className="text-xs text-ink-faint">Maestra · Soles</div>
          </div>
          <a
            href={logoutHref}
            onClick={onNavigate}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-cream text-ink-soft"
          >
            <LogoutIcon size={16} />
          </a>
        </div>
      </div>
    </>
  );
}

/** Desktop sidebar. Hidden below the md breakpoint (768px). */
export function Sidebar({ active }: { active: NavKey }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-line bg-card px-4 py-6 md:flex">
      <SidebarContent active={active} />
    </aside>
  );
}

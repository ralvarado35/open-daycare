"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { NavKey } from "@/lib/nav";
import { newPostHref } from "@/lib/nav";
import { MenuIcon, PlusIcon, SunIcon } from "./icons";
import { SidebarContent } from "./sidebar-content";

type MobileNavClientProps = {
  active: NavKey;
  mobileAvatarSlot: ReactNode;
  drawerUserSlot: ReactNode;
};

/** Mobile chrome (<768px): mini top bar, floating "new post" button and drawer. */
export function MobileNavClient({
  active,
  mobileAvatarSlot,
  drawerUserSlot,
}: MobileNavClientProps) {
  const [open, setOpen] = useState(false);

  // Close the drawer with the Escape key.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      {/* Mini top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2.5 border-b border-line bg-cream/95 px-4 backdrop-blur md:hidden">
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-[linear-gradient(155deg,#f8c3a8,#f2937a)] text-white">
          <SunIcon size={18} />
        </div>
        <span className="font-display text-[15px] font-semibold text-ink">Sala Soles</span>
        <span className="flex-1" />
        {mobileAvatarSlot}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="mobile-drawer"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] border border-line bg-card text-ink-muted"
        >
          <MenuIcon size={20} />
        </button>
      </header>

      {/* Floating "new post" button */}
      <Link
        href={newPostHref}
        aria-label="Nueva publicación"
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(180deg,#f4977e,#ee8164)] text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)] md:hidden"
      >
        <PlusIcon size={26} />
      </Link>

      {/* Drawer backdrop: click to close */}
      <div
        className={`fixed inset-0 z-40 bg-ink/45 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        id="mobile-drawer"
        className={`fixed inset-y-0 left-0 z-50 flex w-[288px] flex-col border-r border-line bg-card shadow-[8px_0_24px_rgba(63,54,46,0.25)] transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        aria-hidden={!open}
        inert={!open}
      >
        <SidebarContent
          active={active}
          onNavigate={close}
          onClose={close}
          userSlot={drawerUserSlot}
        />
      </div>
    </>
  );
}


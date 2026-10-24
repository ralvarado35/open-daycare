import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

type IconShellProps = IconProps & {
  fill?: string;
};

// Shared shell for the inline icons copied from the reference comps.
function IconShell({
  size = 24,
  strokeWidth = 2,
  fill = "none",
  children,
  ...props
}: IconShellProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Brand sun mark (sidebar logo, mobile top bar). */
export function SunIcon(props: IconProps) {
  return (
    <IconShell size={21} strokeWidth={2.2} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </IconShell>
  );
}

/** Plus sign (new post CTA, mobile FAB). */
export function PlusIcon(props: IconProps) {
  return (
    <IconShell size={17} strokeWidth={2.4} {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconShell>
  );
}

/** Home / feed. */
export function FeedIcon(props: IconProps) {
  return (
    <IconShell size={19} {...props}>
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </IconShell>
  );
}

/** Children. */
export function ChildrenIcon(props: IconProps) {
  return (
    <IconShell size={19} {...props}>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
    </IconShell>
  );
}

/** Notices / announcements. */
export function NoticesIcon(props: IconProps) {
  return (
    <IconShell size={19} {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
    </IconShell>
  );
}

/** Account / profile. */
export function AccountIcon(props: IconProps) {
  return (
    <IconShell size={19} {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </IconShell>
  );
}

/** Logout. */
export function LogoutIcon(props: IconProps) {
  return (
    <IconShell size={16} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </IconShell>
  );
}

/** Filled heart (reactions). */
export function HeartIcon(props: IconProps) {
  return (
    <IconShell size={19} fill="currentColor" {...props}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </IconShell>
  );
}

/** Comment bubble. */
export function CommentIcon(props: IconProps) {
  return (
    <IconShell size={18} {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    </IconShell>
  );
}

/** Megaphone (announcement avatar). */
export function MegaphoneIcon(props: IconProps) {
  return (
    <IconShell size={20} {...props}>
      <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </IconShell>
  );
}

/** Image placeholder (photo slot). */
export function PhotoIcon(props: IconProps) {
  return (
    <IconShell size={30} strokeWidth={1.7} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
    </IconShell>
  );
}

/** Camera (composer shortcut chip). */
export function CameraIcon(props: IconProps) {
  return (
    <IconShell size={19} {...props}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </IconShell>
  );
}

/** Hamburger (opens the mobile drawer). */
export function MenuIcon(props: IconProps) {
  return (
    <IconShell size={20} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </IconShell>
  );
}

/** Close X (mobile drawer). */
export function CloseIcon(props: IconProps) {
  return (
    <IconShell size={18} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </IconShell>
  );
}

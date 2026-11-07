export type NavKey = "feed" | "children" | "notices" | "account";

export type NavItem = {
  key: NavKey;
  // Spanish UI label: "Feed", "Niños", "Avisos", "Mi cuenta".
  label: string;
  href: string;
};

// Placeholder href for screens that are not implemented yet. Keep every future
// route centralized here so it can be re-wired in a single place later on.
const placeholderHref = "#";

export const navItems: NavItem[] = [
  { key: "feed", label: "Feed", href: "/" },
  { key: "children", label: "Niños", href: "/kids" },
  { key: "notices", label: "Avisos", href: placeholderHref },
  { key: "account", label: "Mi cuenta", href: placeholderHref },
];

// Routes for screens that do not exist yet in the app.
export const newPostHref = placeholderHref;
export const postDetailHref = placeholderHref;
export const photoHref = placeholderHref;
export const logoutHref = placeholderHref;
export const addChildHref = placeholderHref;
export const editChildHref = placeholderHref;
export const daySummaryHref = placeholderHref;
export const linkParentHref = placeholderHref;

// Auth routes.
export const loginHref = "/login";
export const activateAccountHref = "/activate-account";
export const forgotPasswordHref = placeholderHref;
export const familyFeedHref = placeholderHref;

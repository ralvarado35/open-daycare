import { lookupInvitation } from "@/lib/invitations";
import { ActivateAccountForm } from "./activate-account-form";

/**
 * Server panel of /activate-account (SPEC 08): awaits `searchParams` inside the
 * page's <Suspense> boundary (cacheComponents rule — runtime APIs must sit
 * below the boundary so the shell stays prerenderable), normalizes `?code=` to
 * uppercase, resolves the invitation through `lookup_invitation` and hands
 * both to the client form. Unknown or missing codes simply yield a null
 * invitation: the card falls back to neutral copy and the field stays editable.
 */
export async function ActivateAccountPanel({
  searchParams,
}: {
  searchParams: PageProps<"/activate-account">["searchParams"];
}) {
  const { code } = await searchParams;
  const rawCode = Array.isArray(code) ? (code[0] ?? "") : (code ?? "");
  const initialCode = rawCode.trim().toUpperCase();

  const invitation = initialCode.length > 0 ? await lookupInvitation(initialCode) : null;

  return <ActivateAccountForm initialCode={initialCode} invitation={invitation} />;
}

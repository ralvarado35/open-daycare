import { Suspense } from "react";
import { LoginView } from "./login-view";

/**
 * Login route. The interactive screen is a client component (LoginView); this
 * server shell only extracts the SPEC 08 "activated" flag from `?activated=1`.
 * searchParams is awaited inside a <Suspense>-wrapped gate (cacheComponents
 * rule), so the form renders immediately — the static fallback and the resolved
 * view differ only by the success banner.
 */
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<LoginView activated={false} />}>
      <LoginBannerGate searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginBannerGate({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.activated) ? params.activated[0] : params.activated;
  return <LoginView activated={raw === "1"} />;
}

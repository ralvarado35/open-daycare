import { Suspense } from "react";
import { SunIcon } from "@/app/components/icons";
import { ActivateAccountPanel } from "./activate-account-panel";

/**
 * Activate account screen (SPEC 03 layout, SPEC 08 behavior). Static server
 * shell (badge, headline, lead) plus a <Suspense>-wrapped dynamic panel that
 * reads `?code=`, resolves the invitation through lookup_invitation and mounts
 * the activation form. Reading searchParams makes the route dynamic; keeping
 * the access behind the Suspense boundary follows the cacheComponents rule
 * (same pattern as /kids/[childId]).
 */
export default function ActivateAccountPage({
  searchParams,
}: PageProps<"/activate-account">) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-5 py-10 md:p-[40px]">
      <div className="w-full max-w-[440px]">
        {/* Badge */}
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#f8c3a8,#f2937a)] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <SunIcon size={30} className="text-white" />
        </div>

        <h1 className="mb-[8px] font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-ink-soft">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        <Suspense fallback={null}>
          <ActivateAccountPanel searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

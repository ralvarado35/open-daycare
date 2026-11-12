import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeftIcon } from "@/app/components/icons";
import { KidProfileContent } from "@/app/kids/[childId]/kid-profile-content";
import { MobileNav } from "@/app/components/mobile-nav";
import { Sidebar } from "@/app/components/sidebar";

/**
 * Kid profile page (SPEC 09). Fully dynamic: children live in Supabase, so
 * there is no stable list to pre-render at build time (no generateStaticParams).
 * The kid-independent chrome (sidebar, top bar, back link, container) forms
 * the static shell; the kid-dependent content runs inside a <Suspense>
 * boundary because `params` is only available after resolve (required by
 * cacheComponents). An unknown or malformed uuid falls through to notFound()
 * on request.
 */
export default function KidProfile({ params }: PageProps<"/kids/[childId]">) {
  return (
    <div className="flex min-h-dvh bg-cream">
      <Sidebar active="children" />
      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <MobileNav active="children" />
        <div className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-6 md:px-10 md:pb-20 md:pt-[34px]">
          {/* Back link to the children list */}
          <Link
            href="/kids"
            className="mb-5 flex items-center gap-[7px] text-sm font-bold text-ink-soft"
          >
            <ChevronLeftIcon />
            Volver a Niños
          </Link>

          <Suspense fallback={null}>
            <KidProfileContent params={params} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

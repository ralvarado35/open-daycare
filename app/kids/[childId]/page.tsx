import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeftIcon } from "@/app/components/icons";
import { KidProfileContent } from "@/app/kids/[childId]/kid-profile-content";
import { MobileNav } from "@/app/components/mobile-nav";
import { Sidebar } from "@/app/components/sidebar";
import { kids } from "@/lib/kids-data";

// Pre-render every kid profile at build time from the mock data, mirroring the
// reference comp (references/pantallas/perfil-nino.dc.html).
export async function generateStaticParams() {
  return kids.map((kid) => ({ childId: kid.id }));
}

/**
 * Kid profile page. The kid-independent chrome (sidebar, top bar, container)
 * forms the static shell; the kid-dependent content lives inside a <Suspense>
 * boundary because `params` is only available after resolve (required by
 * cacheComponents; `dynamicParams` is not available there). An unknown
 * childId falls through to notFound() while the eight known kids stay
 * statically pre-rendered at build time.
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

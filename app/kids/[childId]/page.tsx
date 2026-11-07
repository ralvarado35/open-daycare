import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeftIcon, PlusIcon, SunIcon, WarningIcon } from "@/app/components/icons";
import { LinkedParentRow } from "@/app/components/linked-parent-row";
import { MobileNav } from "@/app/components/mobile-nav";
import { Sidebar } from "@/app/components/sidebar";
import { kids } from "@/lib/kids-data";
import { daySummaryHref, editChildHref, linkParentHref } from "@/lib/nav";

// Pre-render every kid profile at build time from the mock data, mirroring the
// reference comp (references/pantallas/perfil-nino.dc.html).
export async function generateStaticParams() {
  return kids.map((kid) => ({ childId: kid.id }));
}

// Static headers of the data card, rendered in the comp's order.
const dataRows = [
  { label: "Fecha de nacimiento", value: "birthDateLabel" },
  { label: "Sala", value: "roomLabel" },
  { label: "Ingreso", value: "enrolledLabel" },
] as const;

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

// The kid-dependent profile content. Kept async so its `params` access streams
// from inside the <Suspense> boundary above instead of blocking the shell.
async function KidProfileContent({
  params,
}: {
  params: PageProps<"/kids/[childId]">["params"];
}) {
  const { childId } = await params;
  const kid = kids.find((candidate) => candidate.id === childId);
  if (!kid) {
    notFound();
  }

  return (
    <div className="flex flex-wrap items-start gap-[26px]">
            {/* Main column: header, allergy banner, data card */}
            <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
              <div className="flex items-center gap-[18px]">
                <div
                  className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold"
                  style={{ backgroundColor: kid.avatarBg, color: kid.avatarFg }}
                >
                  {kid.firstName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-display text-[28px] font-semibold text-ink">
                    {kid.firstName} {kid.lastName}
                  </h1>
                  <p className="mt-[3px] text-[15px] text-ink-soft">
                    {kid.ageLabel} · Sala {kid.roomLabel}
                  </p>
                </div>
                <Link
                  href={editChildHref}
                  className="flex-none rounded-[12px] border-[1.5px] border-line bg-card px-4 py-[9px] text-sm font-bold text-ink-muted"
                >
                  Editar
                </Link>
              </div>

              {kid.allergyNotice ? (
                <div className="flex gap-[14px] rounded-[16px] bg-[#fbdad6] px-[18px] py-4">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#f4a8a0]">
                    <WarningIcon />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-[2px] text-[15px] font-extrabold text-[#c5413a]">
                      Alergias y notas
                    </div>
                    <div className="text-[14.5px] leading-[1.5] text-[#b25249]">
                      {kid.allergyNotice}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-[16px] border border-line bg-card">
                {dataRows.map((row, index) => (
                  <div
                    key={row.value}
                    className={`flex justify-between px-[18px] py-[15px] ${
                      index < dataRows.length - 1 ? "border-b border-line-soft" : ""
                    }`}
                  >
                    <span className="text-[14.5px] text-ink-soft">{row.label}</span>
                    <span className="text-[14.5px] font-extrabold text-ink">
                      {kid[row.value]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Side column: day summary CTA, linked parents */}
            <div className="flex w-[300px] flex-none flex-col gap-[14px]">
              <Link
                href={daySummaryHref}
                className="flex items-center justify-center gap-[9px] rounded-[14px] bg-ink py-[13px] text-[15px] font-extrabold text-white"
              >
                <SunIcon size={18} />
                Resumen del día
              </Link>
              <div className="rounded-[16px] border border-line bg-card px-[18px] py-4">
                <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[0.8px] text-[#8a7c6d]">
                  PADRES VINCULADOS
                </div>
                <div className="flex flex-col gap-[14px]">
                  {kid.parents.map((parent) => (
                    <LinkedParentRow key={parent.id} parent={parent} />
                  ))}
                  <Link href={linkParentHref} className="flex items-center gap-3 pt-2">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#d8cbba] text-[#b0a290]">
                      <PlusIcon size={18} strokeWidth={2.2} />
                    </span>
                    <span className="text-[14.5px] font-extrabold text-[#c5503a]">
                      Vincular otro padre
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
  );
}

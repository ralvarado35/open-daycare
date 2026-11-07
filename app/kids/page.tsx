import { MobileNav } from "@/app/components/mobile-nav";
import { SearchIcon } from "@/app/components/icons";
import { KidCard } from "@/app/components/kid-card";
import { AddChildDialog } from "@/app/components/add-child-dialog";
import { Sidebar } from "@/app/components/sidebar";
import { kids } from "@/lib/kids-data";

/**
 * Children list. Static rendering of the mock data from lib/kids-data.ts,
 * mirroring the reference comp (references/pantallas/ninos.dc.html). The
 * search input is decorative: there is no filtering logic in this demo.
 */
export default function Kids() {
  return (
    <div className="flex min-h-dvh bg-cream">
      <Sidebar active="children" />
      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <MobileNav active="children" />
        <div className="mx-auto w-full max-w-[880px] px-5 pb-24 pt-6 md:px-10 md:pb-20 md:pt-[34px]">
          {/* Page header: title + "add kid" CTA */}
          <div className="mb-[22px] flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-accent-dark">
                GESTIÓN
              </p>
              <h1 className="font-display text-[30px] font-semibold text-ink">Niños</h1>
            </div>
            <AddChildDialog />
          </div>

          {/* Decorative search box (no filtering logic) */}
          <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-card px-4 py-3">
            <SearchIcon className="flex-none text-[#b0a290]" />
            <input
              type="text"
              placeholder="Buscar niño…"
              aria-label="Buscar niño"
              className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-ink outline-none placeholder:text-[#b6a99b]"
            />
          </div>

          {/* Room divider */}
          <div className="mb-[14px] flex items-center gap-3">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
              SALA SOLES
            </span>
            <span className="text-[13px] text-ink-faint">{kids.length} niños</span>
            <span className="h-px flex-1 bg-line-faint" />
          </div>

          {/* Kid cards: single column below md (768px), two above */}
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
            {kids.map((kid) => (
              <KidCard key={kid.id} kid={kid} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

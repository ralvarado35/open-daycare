import { Suspense } from "react";
import { MobileNav } from "@/app/components/mobile-nav";
import { SearchIcon } from "@/app/components/icons";
import { KidCard } from "@/app/components/kid-card";
import { AddChildDialog } from "@/app/components/add-child-dialog";
import { Sidebar } from "@/app/components/sidebar";
import { getStaffDaycareId, listRooms, listRoomsWithChildren } from "@/lib/children";

/**
 * Header CTA: resolves the staff's rooms server-side and hands them to the
 * dialog as a prop. Behind a <Suspense> hole so the static shell does not
 * block on cookies() under cacheComponents.
 */
async function AddChildDialogLoader() {
  const daycareId = await getStaffDaycareId();
  if (!daycareId) {
    return <AddChildDialog rooms={[]} />;
  }
  const rooms = await listRooms(daycareId);
  return <AddChildDialog rooms={rooms} />;
}

/**
 * Room sections: one divider per room ("SALA SOLES · 3 niños") ordered by
 * created_at, each followed by a grid of that room's active children. Rooms
 * with no children render the divider and an empty grid.
 */
async function RoomSections() {
  const daycareId = await getStaffDaycareId();
  if (!daycareId) {
    return null;
  }
  const rooms = await listRoomsWithChildren(daycareId);

  return (
    <>
      {rooms.map((room) => {
        const childCount = room.children.length;
        const countLabel = `${childCount} ${childCount === 1 ? "niño" : "niños"}`;
        return (
          <section key={room.id} className="mb-6">
            {/* Room divider with real count */}
            <div className="mb-[14px] flex items-center gap-3">
              <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
                SALA {room.label.toUpperCase()}
              </span>
              <span className="text-[13px] text-ink-faint">{countLabel}</span>
              <span className="h-px flex-1 bg-line-faint" />
            </div>

            {/* Kid cards: single column below md (768px), two above */}
            <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
              {room.children.map((child) => (
                <KidCard key={child.id} kid={child} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

/**
 * Children list backed by Supabase (SPEC 09). Chrome (sidebar, top bar,
 * header, decorative search) is the static shell; the dialog and the room
 * sections stream in from 'use cache: private' data functions. The search
 * input stays decorative: no filtering logic in this spec.
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
            <Suspense fallback={null}>
              <AddChildDialogLoader />
            </Suspense>
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

          <Suspense fallback={null}>
            <RoomSections />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

import type { Parent, ParentStatus } from "@/lib/kids-data";

// Chip presentation per parent account status, as in the reference comp
// (references/pantallas/perfil-nino.dc.html). Spanish labels live here,
// not in the data.
const statusChips: Record<ParentStatus, { label: string; className: string }> = {
  active: { label: "ACTIVA", className: "bg-[#cfebd8] text-[#3e9b6c]" },
  pending: { label: "PENDIENTE", className: "bg-[#f7e7a6] text-[#9a7b1e]" },
};

type LinkedParentRowProps = {
  parent: Parent;
};

/** Row of a linked parent in the profile's "PADRES VINCULADOS" card. */
export function LinkedParentRow({ parent }: LinkedParentRowProps) {
  const chip = statusChips[parent.status];
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-base font-semibold text-white"
        style={{ backgroundColor: parent.avatarBg }}
      >
        {parent.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-extrabold text-ink">{parent.name}</div>
        <div className="text-[12.5px] text-ink-faint">{parent.relationLabel}</div>
      </div>
      <span
        className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${chip.className}`}
      >
        {chip.label}
      </span>
    </div>
  );
}

import Link from "next/link";
import type { ChildView } from "@/lib/children";
import { ChevronRightIcon } from "./icons";

type KidCardProps = {
  kid: ChildView;
};

/**
 * Kid card for the children list. Links to the kid's own profile page
 * (/kids/{uuid}). The tail is conditional: allergy pill (only when the child
 * has allergy_tags) or plain chevron, exactly as in the reference comp.
 */
export function KidCard({ kid }: KidCardProps) {
  return (
    <Link
      href={`/kids/${kid.id}`}
      className="flex min-w-0 items-center gap-[14px] rounded-[18px] border border-line bg-card p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition-[border-color,transform] duration-150 hover:-translate-y-[2px] hover:border-accent"
    >
      <div
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ backgroundColor: kid.avatarBg, color: kid.avatarFg }}
      >
        {kid.firstName.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-semibold text-ink">
          {kid.firstName} {kid.lastName}
        </div>
        <div className="text-[13px] text-ink-faint">
          {kid.ageLabel} · {kid.parentsLinkedLabel}
        </div>
      </div>
      {kid.allergyTag ? (
        <span className="flex-none rounded-full bg-[#fbd8cc] px-[9px] py-[5px] text-[11px] font-extrabold text-[#d9684a]">
          {kid.allergyTag}
        </span>
      ) : (
        <ChevronRightIcon className="flex-none text-[#cbb89f]" />
      )}
    </Link>
  );
}

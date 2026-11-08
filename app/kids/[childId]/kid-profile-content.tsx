"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { useState, use } from "react";
import { PlusIcon, SunIcon, WarningIcon } from "@/app/components/icons";
import { LinkedParentRow } from "@/app/components/linked-parent-row";
import { LinkParentDialog } from "@/app/components/link-parent-dialog";
import { kids } from "@/lib/kids-data";
import { daySummaryHref, editChildHref } from "@/lib/nav";

// Static headers of the data card, rendered in the comp's order.
const dataRows = [
  { label: "Fecha de nacimiento", value: "birthDateLabel" },
  { label: "Sala", value: "roomLabel" },
  { label: "Ingreso", value: "enrolledLabel" },
] as const;

/**
 * Kid-dependent profile content. Runs inside the <Suspense> boundary rendered
 * by the server `KidProfile` shell so `params` resolves after Suspense
 * (required by cacheComponents). Handles the client-side `open` state for the
 * LinkParentDialog triggered from the "Vincular otro padre" link.
 */
export function KidProfileContent({
  params,
}: {
  params: { childId: string } | Promise<{ childId: string }>;
}) {
  const { childId } = use(params as Promise<{ childId: string }>);
  const kid = kids.find((candidate) => candidate.id === childId);
  if (!kid) {
    notFound();
  }

  const [open, setOpen] = useState(false);

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
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(true);
                    }}
                    className="flex items-center gap-3 pt-2"
                  >
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#d8cbba] text-[#b0a290]">
                      <PlusIcon size={18} strokeWidth={2.2} />
                    </span>
                    <span className="text-[14.5px] font-extrabold text-[#c5503a]">
                      Vincular otro padre
                    </span>
                  </a>
                </div>
              </div>
            </div>

            <LinkParentDialog
              open={open}
              onClose={() => setOpen(false)}
              childName={`${kid.firstName} ${kid.lastName}`}
            />
          </div>
  );
}

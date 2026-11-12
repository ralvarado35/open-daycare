"use client";

import { useState } from "react";
import { LinkParentDialog } from "./link-parent-dialog";
import { PlusIcon } from "./icons";

/**
 * Client wrapper for the "Vincular otro padre" entry in the kid profile:
 * renders the dashed-plus trigger (same look as the SPEC 09 decorative link)
 * and owns the open state of the LinkParentDialog, which is a SPEC 08 real
 * flow (creates the invitation + sends the email through a Server Action).
 */
export function LinkParentTrigger({
  childId,
  childName,
}: {
  childId: string;
  childName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 cursor-pointer"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#d8cbba] text-[#b0a290]">
          <PlusIcon size={18} strokeWidth={2.2} />
        </span>
        <span className="text-[14.5px] font-extrabold text-[#c5503a]">
          Vincular otro padre
        </span>
      </button>
      {open && (
        <LinkParentDialog
          open
          onClose={() => setOpen(false)}
          childId={childId}
          childName={childName}
        />
      )}
    </>
  );
}

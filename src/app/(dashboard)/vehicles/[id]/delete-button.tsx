"use client"

import * as React from "react"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/utils"
import { deleteVehicle } from "../actions"

export function DeleteVehicleButton({
  id,
  advanceAmount,
}: {
  id: string
  advanceAmount: number
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  function handleConfirm() {
    startTransition(async () => {
      try {
        await deleteVehicle(id)
        toast.success("Vehicle deleted", {
          description: `${formatMoney(advanceAmount)} freed up.`,
        })
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          typeof (err as { digest?: unknown }).digest === "string" &&
          (err as { digest: string }).digest.includes("NEXT_REDIRECT")
        ) {
          return
        }
        toast.error("Failed to delete vehicle")
      }
    })
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        className="w-full h-9 text-[13px]"
      >
        <Trash2 className="size-3.5" />
        Delete vehicle
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-xl bg-popover p-5 text-popover-foreground ring-1 ring-foreground/10 shadow-md"
          >
            <h3 className="text-[15px] font-semibold tracking-tight">
              Delete vehicle?
            </h3>
            <p className="mt-2 text-[12.5px] text-muted-foreground">
              This will also reverse the advance and free up{" "}
              <span className="text-foreground tabular-nums font-medium">
                {formatMoney(advanceAmount)}
              </span>{" "}
              on your floorplan.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                className="h-8 rounded-md border border-border px-3 text-[12.5px] hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={pending}
                className="inline-flex items-center gap-1.5 h-8 rounded-md bg-destructive/10 text-destructive border border-destructive/30 px-3 text-[12.5px] hover:bg-destructive/20 transition-colors disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

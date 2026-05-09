"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, RotateCcw, Tag } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/utils"
import { reversePayoff } from "../actions"
import {
  MarkAsSoldDialog,
  type MarkAsSoldVehicle,
} from "../_components/mark-as-sold-dialog"

export function MarkAsSoldButton({ vehicle }: { vehicle: MarkAsSoldVehicle }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full h-9 text-[13px] justify-start"
      >
        <Tag className="size-3.5" />
        Mark as Sold
      </Button>
      <MarkAsSoldDialog vehicle={vehicle} open={open} onOpenChange={setOpen} />
    </>
  )
}

export function ReversePayoffButton({
  vehicleId,
  advanceAmount,
}: {
  vehicleId: string
  advanceAmount: number
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await reversePayoff(vehicleId)
      if (!result.ok) {
        toast.error("Failed to reverse payoff", { description: result.error })
        return
      }
      toast.success("Payoff reversed")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        title="Use if you marked this car sold by mistake"
        className="w-full h-9 text-[13px] justify-start"
      >
        <RotateCcw className="size-3.5" />
        Reverse Payoff
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm px-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-xl bg-popover p-5 text-popover-foreground ring-1 ring-foreground/10 shadow-md"
          >
            <h3 className="text-[15px] font-semibold tracking-tight">
              Reverse this payoff?
            </h3>
            <p className="mt-2 text-[12.5px] text-muted-foreground">
              This will reset the car to{" "}
              <span className="text-foreground font-medium">Active</span> and
              re-deduct{" "}
              <span className="text-foreground tabular-nums font-medium">
                {formatMoney(advanceAmount)}
              </span>{" "}
              from your floorplan.
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
                    Reversing…
                  </>
                ) : (
                  "Reverse"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

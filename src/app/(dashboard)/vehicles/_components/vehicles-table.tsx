"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Eye,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Tag,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn, formatMoney, formatProfit } from "@/lib/utils"
import { deleteVehicle, reversePayoff } from "../actions"
import {
  MarkAsSoldDialog,
  type MarkAsSoldVehicle,
} from "./mark-as-sold-dialog"

export type VehicleRow = {
  id: string
  vin: string
  year: number
  make: string
  model: string
  trim: string | null
  mileage: number | null
  purchasePrice: number
  advanceAmount: number
  purchaseDate: string
  source: string | null
  stockNumber: string | null
  status: string
  salePrice: number | null
  daysOnLot: number
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className="border-primary/30 bg-primary/10 text-primary"
      >
        Active
      </Badge>
    )
  }
  if (status === "paid_off") {
    return (
      <Badge
        variant="outline"
        className="border-zinc-500/30 bg-zinc-500/10 text-zinc-300"
      >
        Paid Off
      </Badge>
    )
  }
  if (status === "repo") {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 bg-destructive/10 text-destructive"
      >
        Repo
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
      {status}
    </Badge>
  )
}

function DaysPill({ days }: { days: number }) {
  const tone =
    days >= 90
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : days >= 60
      ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
      : days >= 30
      ? "border-border/70 bg-muted text-muted-foreground"
      : "border-primary/30 bg-primary/10 text-primary"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums",
        tone
      )}
    >
      {days}d
    </span>
  )
}

function ProfitCell({ row }: { row: VehicleRow }) {
  if (row.status !== "paid_off" || row.salePrice == null) {
    return <span className="text-muted-foreground">—</span>
  }
  const info = formatProfit(row.salePrice, row.purchasePrice)
  return (
    <div className="flex flex-col items-end leading-tight">
      <span
        className={cn(
          "text-[13px] tabular-nums font-medium",
          info.isProfit ? "text-primary" : "text-destructive"
        )}
      >
        {info.formatted}
      </span>
      <span
        className={cn(
          "text-[10.5px] tabular-nums",
          info.isProfit ? "text-primary/80" : "text-destructive/80"
        )}
      >
        {info.margin.toFixed(1)}%
      </span>
    </div>
  )
}

export function VehiclesTable({ vehicles }: { vehicles: VehicleRow[] }) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = React.useState<VehicleRow | null>(
    null
  )
  const [confirmReverse, setConfirmReverse] = React.useState<VehicleRow | null>(
    null
  )
  const [sellTarget, setSellTarget] = React.useState<MarkAsSoldVehicle | null>(
    null
  )
  const [pending, startTransition] = React.useTransition()

  function handleRowClick(id: string) {
    router.push(`/vehicles/${id}`)
  }

  async function handleDelete(v: VehicleRow) {
    startTransition(async () => {
      try {
        await deleteVehicle(v.id)
        toast.success("Vehicle deleted", {
          description: `${formatMoney(v.advanceAmount)} freed up.`,
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
      } finally {
        setConfirmDelete(null)
      }
    })
  }

  function handleReverse(v: VehicleRow) {
    startTransition(async () => {
      const result = await reversePayoff(v.id)
      if (!result.ok) {
        toast.error("Failed to reverse payoff", { description: result.error })
        setConfirmReverse(null)
        return
      }
      toast.success("Payoff reversed")
      setConfirmReverse(null)
      router.refresh()
    })
  }

  return (
    <>
      <div className="rounded-lg border border-border/70 bg-card/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="h-9 px-4 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                Stock #
              </TableHead>
              <TableHead className="h-9 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                VIN
              </TableHead>
              <TableHead className="h-9 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                Vehicle
              </TableHead>
              <TableHead className="h-9 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                Purchase
              </TableHead>
              <TableHead className="h-9 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                Sale
              </TableHead>
              <TableHead className="h-9 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                Profit
              </TableHead>
              <TableHead className="h-9 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                Days
              </TableHead>
              <TableHead className="h-9 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                Status
              </TableHead>
              <TableHead className="h-9 pr-3 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => {
              const isPaidOff = v.status === "paid_off"
              return (
                <TableRow
                  key={v.id}
                  onClick={() => handleRowClick(v.id)}
                  className="border-border/40 cursor-pointer hover:bg-accent/30 transition-colors"
                >
                  <TableCell className="px-4 py-3 text-[12.5px] tabular-nums text-muted-foreground">
                    {v.stockNumber || "—"}
                  </TableCell>
                  <TableCell className="py-3" title={v.vin}>
                    <span className="font-mono text-[12px] text-muted-foreground">
                      …{v.vin.slice(-6)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-[13px] font-medium text-foreground">
                    {v.year} {v.make} {v.model}
                    {v.trim ? (
                      <span className="text-muted-foreground"> {v.trim}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="py-3 text-right text-[13px] tabular-nums font-medium text-foreground">
                    {formatMoney(v.purchasePrice)}
                  </TableCell>
                  <TableCell className="py-3 text-right text-[13px] tabular-nums text-foreground">
                    {v.salePrice != null ? (
                      formatMoney(v.salePrice)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <ProfitCell row={v} />
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <DaysPill days={v.daysOnLot} />
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusBadge status={v.status} />
                  </TableCell>
                  <TableCell
                    className="pr-3 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        aria-label="Actions"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          className="text-[13px]"
                          onClick={() => router.push(`/vehicles/${v.id}`)}
                        >
                          <Eye className="size-3.5" />
                          View
                        </DropdownMenuItem>
                        {!isPaidOff ? (
                          <>
                            <DropdownMenuItem
                              className="text-[13px]"
                              onClick={() =>
                                router.push(`/vehicles/${v.id}?edit=1`)
                              }
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-[13px]"
                              onClick={() =>
                                setSellTarget({
                                  id: v.id,
                                  vin: v.vin,
                                  year: v.year,
                                  make: v.make,
                                  model: v.model,
                                  trim: v.trim,
                                  purchasePrice: v.purchasePrice,
                                  advanceAmount: v.advanceAmount,
                                  purchaseDate: v.purchaseDate,
                                })
                              }
                            >
                              <Tag className="size-3.5" />
                              Mark as Sold
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              className="text-[13px]"
                              onClick={() => setConfirmDelete(v)}
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            variant="destructive"
                            className="text-[13px]"
                            onClick={() => setConfirmReverse(v)}
                          >
                            <RotateCcw className="size-3.5" />
                            Reverse Payoff
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <MarkAsSoldDialog
        vehicle={sellTarget}
        open={sellTarget != null}
        onOpenChange={(open) => {
          if (!open) setSellTarget(null)
        }}
      />

      {confirmDelete ? (
        <DeleteConfirm
          vehicle={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
          pending={pending}
        />
      ) : null}

      {confirmReverse ? (
        <ReverseConfirm
          vehicle={confirmReverse}
          onCancel={() => setConfirmReverse(null)}
          onConfirm={() => handleReverse(confirmReverse)}
          pending={pending}
        />
      ) : null}
    </>
  )
}

function DeleteConfirm({
  vehicle,
  onCancel,
  onConfirm,
  pending,
}: {
  vehicle: VehicleRow
  onCancel: () => void
  onConfirm: () => void
  pending: boolean
}) {
  return (
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
            {formatMoney(vehicle.advanceAmount)}
          </span>{" "}
          on your floorplan.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={pending}
            className="h-8 rounded-md border border-border px-3 text-[12.5px] hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="h-8 rounded-md bg-destructive/10 text-destructive border border-destructive/30 px-3 text-[12.5px] hover:bg-destructive/20 transition-colors disabled:opacity-50"
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReverseConfirm({
  vehicle,
  onCancel,
  onConfirm,
  pending,
}: {
  vehicle: VehicleRow
  onCancel: () => void
  onConfirm: () => void
  pending: boolean
}) {
  return (
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
          <span className="text-foreground font-medium">Active</span> and re-deduct{" "}
          <span className="text-foreground tabular-nums font-medium">
            {formatMoney(vehicle.advanceAmount)}
          </span>{" "}
          from your floorplan.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={pending}
            className="h-8 rounded-md border border-border px-3 text-[12.5px] hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            className="h-8 rounded-md bg-destructive/10 text-destructive border border-destructive/30 px-3 text-[12.5px] hover:bg-destructive/20 transition-colors disabled:opacity-50"
          >
            {pending ? "Reversing…" : "Reverse"}
          </button>
        </div>
      </div>
    </div>
  )
}

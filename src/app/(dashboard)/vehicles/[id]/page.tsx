import Link from "next/link"
import { notFound } from "next/navigation"
import { differenceInCalendarDays } from "date-fns"
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Tag,
} from "lucide-react"

import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatMoney } from "@/lib/utils"
import { DeleteVehicleButton } from "./delete-button"
import { VehicleInfoCard } from "./edit-form"

type RouteParams = Promise<{ id: string }>
type Search = Promise<{ edit?: string }>

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
  if (status === "sold") {
    return (
      <Badge
        variant="outline"
        className="border-blue-400/30 bg-blue-400/10 text-blue-300"
      >
        Sold
      </Badge>
    )
  }
  if (status === "paid_off") {
    return (
      <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
        Paid off
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
      {status}
    </Badge>
  )
}

function TxBadge({ type }: { type: string }) {
  if (type === "advance") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-amber-400/30 bg-amber-400/10 text-amber-300 font-medium"
      >
        <ArrowDownLeft className="size-3" />
        Advance
      </Badge>
    )
  }
  if (type === "payoff") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-primary/30 bg-primary/10 text-primary font-medium"
      >
        <ArrowUpRight className="size-3" />
        Payoff
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
      Adjustment
    </Badge>
  )
}

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: RouteParams
  searchParams: Search
}) {
  const { id } = await params
  const { edit } = await searchParams

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { date: "desc" },
      },
    },
  })
  if (!vehicle) notFound()

  // Distinct sources for the edit-form datalist.
  const sourceRows = await prisma.vehicle.findMany({
    where: { source: { not: null } },
    distinct: ["source"],
    select: { source: true },
  })
  const sources = sourceRows
    .map((r) => r.source!)
    .filter((s) => s.trim().length > 0)
    .sort()

  const today = new Date()
  const daysOnLot = Math.max(
    0,
    differenceInCalendarDays(today, vehicle.purchaseDate)
  )
  const daysSinceSold =
    vehicle.saleDate != null
      ? Math.max(0, differenceInCalendarDays(today, vehicle.saleDate))
      : null
  const profit =
    vehicle.salePrice != null && vehicle.status === "paid_off"
      ? Number(vehicle.salePrice) - Number(vehicle.purchasePrice)
      : null

  const detail = {
    id: vehicle.id,
    vin: vehicle.vin,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    mileage: vehicle.mileage,
    purchasePrice: Number(vehicle.purchasePrice),
    purchaseDate: vehicle.purchaseDate.toISOString(),
    source: vehicle.source,
    stockNumber: vehicle.stockNumber,
    notes: vehicle.notes,
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2">
        <Link
          href="/vehicles"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to vehicles
        </Link>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] font-semibold tracking-tight leading-none">
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.trim ? (
                  <span className="text-muted-foreground">
                    {" "}
                    {vehicle.trim}
                  </span>
                ) : null}
              </h1>
              <StatusBadge status={vehicle.status} />
            </div>
            <p className="text-[13px] text-muted-foreground">
              {vehicle.stockNumber ? (
                <span className="inline-flex items-center gap-1">
                  <Tag className="size-3.5" />
                  Stock #{vehicle.stockNumber}
                  <span className="mx-1 text-muted-foreground/50">·</span>
                </span>
              ) : null}
              <span className="font-mono">{vehicle.vin}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <VehicleInfoCard
            vehicle={detail}
            initialEdit={edit === "1"}
            sources={sources}
          />

          <div className="rounded-lg border border-border/70 bg-card/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
              <h2 className="text-[14px] font-semibold tracking-tight">
                Transaction history
              </h2>
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/70">
                {vehicle.transactions.length}{" "}
                {vehicle.transactions.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            {vehicle.transactions.length === 0 ? (
              <div className="px-5 py-10 text-center text-[12.5px] text-muted-foreground">
                No transactions yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="h-9 px-5 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                      Type
                    </TableHead>
                    <TableHead className="h-9 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                      Description
                    </TableHead>
                    <TableHead className="h-9 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                      Amount
                    </TableHead>
                    <TableHead className="h-9 pr-5 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicle.transactions.map((tx) => (
                    <TableRow key={tx.id} className="border-border/40">
                      <TableCell className="px-5 py-3">
                        <TxBadge type={tx.type} />
                      </TableCell>
                      <TableCell className="py-3 text-[12.5px] text-foreground/90">
                        {tx.description ?? "—"}
                      </TableCell>
                      <TableCell
                        className={`py-3 text-right text-[13px] tabular-nums font-medium ${
                          tx.type === "payoff" ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {tx.type === "payoff" ? "+" : "−"}
                        {formatMoney(Number(tx.amount))}
                      </TableCell>
                      <TableCell className="pr-5 py-3 text-right text-[12px] tabular-nums text-muted-foreground">
                        {formatDate(tx.date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-border/70 bg-card/60 p-5">
            <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Quick stats
            </h3>
            <div className="mt-4 space-y-3 text-[13px]">
              <Stat
                icon={Clock}
                label="Days on lot"
                value={`${daysOnLot}d`}
              />
              {daysSinceSold != null ? (
                <Stat
                  icon={CheckCircle2}
                  label="Days since sold"
                  value={`${daysSinceSold}d`}
                />
              ) : null}
              {profit != null ? (
                <Stat
                  icon={CheckCircle2}
                  label="Profit"
                  value={formatMoney(profit)}
                  highlight={profit >= 0}
                />
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card/60 p-5">
            <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Actions
            </h3>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="outline"
                disabled
                title="Coming in Phase 3"
                className="w-full h-9 text-[13px] justify-start"
              >
                Mark as Sold
                <span className="ml-auto text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/70">
                  Phase 3
                </span>
              </Button>
              <Button
                variant="outline"
                disabled
                title="Coming in Phase 3"
                className="w-full h-9 text-[13px] justify-start"
              >
                Mark as Paid Off
                <span className="ml-auto text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/70">
                  Phase 3
                </span>
              </Button>
              <DeleteVehicleButton
                id={vehicle.id}
                advanceAmount={Number(vehicle.advanceAmount)}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span
        className={`tabular-nums font-medium ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  )
}

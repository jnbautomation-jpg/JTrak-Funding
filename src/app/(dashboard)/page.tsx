import Link from "next/link"
import { differenceInCalendarDays } from "date-fns"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Car,
  CircleDollarSign,
  Clock,
  PlusCircle,
} from "lucide-react"

import { StatCard } from "@/components/stat-card"
import { AgingBucketCard } from "@/components/aging-bucket-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatMoney } from "@/lib/utils"
import {
  getActiveVehicleCount,
  getAgingBuckets,
  getAvailableCredit,
  getAvgDaysOnLot,
  getOldestActiveInventory,
  getOutstandingBalance,
  getPrimaryFloorplan,
  getRecentTransactions,
} from "@/lib/floorplan"

const AGING_TONES: Record<string, "good" | "neutral" | "warning" | "bad"> = {
  "0-30": "good",
  "31-60": "neutral",
  "61-90": "warning",
  "90+": "bad",
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

function DaysPill({ days }: { days: number }) {
  const tone =
    days >= 90
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : days >= 60
      ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
      : "border-border/70 bg-muted text-muted-foreground"
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums ${tone}`}
    >
      {days}d
    </span>
  )
}

function describeVehicle(v: {
  year: number
  make: string
  model: string
  trim: string | null
}) {
  return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")
}

export default async function DashboardPage() {
  const today = formatDate(new Date(), "EEEE, MMM d, yyyy")
  const floorplan = await getPrimaryFloorplan()
  if (!floorplan) return null // layout handles redirect

  const creditLimit = Number(floorplan.creditLimit)
  const [
    outstanding,
    available,
    activeCount,
    avgDays,
    buckets,
    recent,
    oldest,
  ] = await Promise.all([
    getOutstandingBalance(floorplan.id),
    getAvailableCredit(floorplan.id, creditLimit),
    getActiveVehicleCount(floorplan.id),
    getAvgDaysOnLot(floorplan.id),
    getAgingBuckets(floorplan.id),
    getRecentTransactions(floorplan.id, 5),
    getOldestActiveInventory(floorplan.id, 5),
  ])

  const utilizationPct = creditLimit > 0 ? (outstanding / creditLimit) * 100 : 0
  const availablePct = creditLimit > 0 ? (available / creditLimit) * 100 : 0
  const totalAging = Object.values(buckets).reduce(
    (acc, b) => acc + b.total,
    0
  )

  const isEmpty = activeCount === 0 && recent.length === 0

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1.5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-semibold tracking-tight leading-none">
            Dashboard
          </h1>
          <p className="text-[13.5px] text-muted-foreground">
            Overview of your floorplan as of {today}.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-3 text-[11.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" />
            {formatMoney(creditLimit)} line
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="tabular-nums">
            Utilization {utilizationPct.toFixed(1)}%
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span>{floorplan.investor.name}</span>
        </div>
      </header>

      <section
        className={`grid gap-3 md:grid-cols-2 lg:grid-cols-4 ${
          isEmpty ? "opacity-60" : ""
        }`}
      >
        <StatCard
          label="Outstanding Balance"
          value={formatMoney(outstanding)}
          subtext={`of ${formatMoney(creditLimit)} line`}
          icon={Banknote}
        />
        <StatCard
          label="Available Credit"
          value={formatMoney(available)}
          subtext={`${availablePct.toFixed(1)}% available`}
          icon={CircleDollarSign}
        />
        <StatCard
          label="Active Vehicles"
          value={String(activeCount)}
          subtext="in inventory"
          icon={Car}
        />
        <StatCard
          label="Avg Days on Lot"
          value={String(avgDays)}
          subtext="across active inventory"
          icon={Clock}
          accent={avgDays >= 60 ? "amber" : "default"}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Inventory aging
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Distribution of {activeCount}{" "}
              {activeCount === 1 ? "active vehicle" : "active vehicles"} by days
              on lot.
            </p>
          </div>
          {totalAging > 0 ? (
            <span className="hidden sm:inline-block text-[11px] text-muted-foreground tabular-nums">
              Total {formatMoney(totalAging)}
            </span>
          ) : null}
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {(["0-30", "31-60", "61-90", "90+"] as const).map((key) => {
            const b = buckets[key]
            const range =
              key === "0-30"
                ? "0–30 days"
                : key === "31-60"
                ? "31–60 days"
                : key === "61-90"
                ? "61–90 days"
                : "90+ days"
            const share = totalAging > 0 ? b.total / totalAging : 0
            return (
              <AgingBucketCard
                key={key}
                range={range}
                vehicles={b.count}
                amount={b.total}
                share={share}
                tone={AGING_TONES[key]}
              />
            )
          })}
        </div>
      </section>

      {isEmpty ? (
        <section>
          <div className="rounded-xl border border-border/70 bg-card/40 px-6 py-16 text-center">
            <div className="mx-auto flex max-w-md flex-col items-center gap-4">
              <span className="grid size-12 place-items-center rounded-xl bg-card border border-border/80 text-muted-foreground">
                <Car className="size-5" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[15px] font-semibold tracking-tight">
                  Add your first vehicle to see live data
                </h3>
                <p className="text-[12.5px] text-muted-foreground">
                  Recent transactions and oldest inventory will appear here once
                  you start flooring vehicles.
                </p>
              </div>
              <Button render={<Link href="/vehicles" />} className="h-9 text-[13px]">
                <PlusCircle className="size-3.5" />
                Go to vehicles
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-card/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[14px] font-semibold tracking-tight">
                  Recent transactions
                </h3>
                <p className="text-[11.5px] text-muted-foreground">
                  Last 5 advances and payoffs across your floorplan.
                </p>
              </div>
            </div>
            <Separator className="bg-border/60" />
            {recent.length === 0 ? (
              <div className="px-5 py-12 text-center text-[12.5px] text-muted-foreground">
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
                      Vehicle
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
                  {recent.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="border-border/40 hover:bg-accent/30 transition-colors"
                    >
                      <TableCell className="px-5 py-3">
                        <TxBadge type={tx.type} />
                      </TableCell>
                      <TableCell className="py-3 text-[13px] font-medium text-foreground">
                        {tx.vehicle ? describeVehicle(tx.vehicle) : "—"}
                      </TableCell>
                      <TableCell
                        className={`py-3 text-right text-[13px] tabular-nums font-medium ${
                          tx.type === "payoff" ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {tx.type === "payoff" ? "+" : "−"}
                        {formatMoney(Number(tx.amount))}
                      </TableCell>
                      <TableCell className="pr-5 py-3 text-right text-[12.5px] tabular-nums text-muted-foreground">
                        {formatDate(tx.date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="rounded-lg border border-border/70 bg-card/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[14px] font-semibold tracking-tight">
                  Oldest active inventory
                </h3>
                <p className="text-[11.5px] text-muted-foreground">
                  Top 5 vehicles ranked by days on lot.
                </p>
              </div>
            </div>
            <Separator className="bg-border/60" />
            {oldest.length === 0 ? (
              <div className="px-5 py-12 text-center text-[12.5px] text-muted-foreground">
                No active inventory.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="h-9 px-5 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                      Vehicle
                    </TableHead>
                    <TableHead className="h-9 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                      Purchase Price
                    </TableHead>
                    <TableHead className="h-9 pr-5 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                      Days on Lot
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {oldest.map((v) => {
                    const days = Math.max(
                      0,
                      differenceInCalendarDays(new Date(), v.purchaseDate)
                    )
                    return (
                      <TableRow
                        key={v.id}
                        className="border-border/40 hover:bg-accent/30 transition-colors"
                      >
                        <TableCell className="px-5 py-3 text-[13px] font-medium text-foreground">
                          <Link
                            href={`/vehicles/${v.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {describeVehicle(v)}
                          </Link>
                        </TableCell>
                        <TableCell className="py-3 text-right text-[13px] tabular-nums text-foreground">
                          {formatMoney(Number(v.purchasePrice))}
                        </TableCell>
                        <TableCell className="pr-5 py-3 text-right">
                          <DaysPill days={days} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

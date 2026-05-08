import {
  Banknote,
  CircleDollarSign,
  Car,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react"

import { StatCard } from "@/components/stat-card"
import { AgingBucketCard } from "@/components/aging-bucket-card"
import { Badge } from "@/components/ui/badge"
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

// ─────────────────────────────────────────────────────────────────
// STUB DATA — replaced with Prisma queries in Phase 2.
// ─────────────────────────────────────────────────────────────────

const TOTAL_AGING_AMOUNT = 94_200 + 112_800 + 54_300 + 23_200

const AGING_BUCKETS = [
  { range: "0–30 days", vehicles: 8, amount: 94_200, tone: "good" as const },
  { range: "31–60 days", vehicles: 9, amount: 112_800, tone: "neutral" as const },
  { range: "61–90 days", vehicles: 4, amount: 54_300, tone: "warning" as const },
  { range: "90+ days", vehicles: 2, amount: 23_200, tone: "bad" as const },
]

type TxRow = {
  id: string
  type: "advance" | "payoff" | "adjustment"
  vehicle: string
  amount: number
  date: string
}

const RECENT_TRANSACTIONS: TxRow[] = [
  { id: "tx_8nq", type: "payoff", vehicle: "2019 Honda Accord Sport", amount: 14_900, date: "2026-05-07" },
  { id: "tx_8np", type: "advance", vehicle: "2021 Toyota RAV4 LE", amount: 18_750, date: "2026-05-06" },
  { id: "tx_8nm", type: "advance", vehicle: "2018 Ford F-150 XLT", amount: 22_400, date: "2026-05-05" },
  { id: "tx_8nh", type: "payoff", vehicle: "2017 Chevy Equinox LT", amount: 11_200, date: "2026-05-03" },
  { id: "tx_8na", type: "advance", vehicle: "2020 Nissan Altima SV", amount: 13_600, date: "2026-05-02" },
]

type InventoryRow = {
  id: string
  vehicle: string
  purchasePrice: number
  daysOnLot: number
}

const OLDEST_INVENTORY: InventoryRow[] = [
  { id: "v_122", vehicle: "2016 BMW 328i xDrive", purchasePrice: 12_400, daysOnLot: 118 },
  { id: "v_103", vehicle: "2015 Audi A4 Premium", purchasePrice: 10_800, daysOnLot: 96 },
  { id: "v_141", vehicle: "2018 Jeep Cherokee Latitude", purchasePrice: 14_200, daysOnLot: 84 },
  { id: "v_137", vehicle: "2017 Hyundai Sonata SE", purchasePrice: 9_600, daysOnLot: 79 },
  { id: "v_152", vehicle: "2016 Nissan Murano SV", purchasePrice: 11_900, daysOnLot: 71 },
]

// ─────────────────────────────────────────────────────────────────
// UI
// ─────────────────────────────────────────────────────────────────

function TxBadge({ type }: { type: TxRow["type"] }) {
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

export default function DashboardPage() {
  const today = formatDate(new Date(), "EEEE, MMM d, yyyy")
  const utilizationPct = ((284_500 / 400_000) * 100).toFixed(1)

  return (
    <div className="space-y-8">
      {/* ── Page header ───────────────────────────────────────── */}
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
            $400,000 line
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="tabular-nums">Utilization {utilizationPct}%</span>
          <span className="text-muted-foreground/50">·</span>
          <span>1 investor</span>
        </div>
      </header>

      {/* ── Stat cards ────────────────────────────────────────── */}
      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Outstanding Balance"
          value={formatMoney(284_500)}
          subtext="of $400,000 line"
          icon={Banknote}
          trend={{ direction: "up", value: "+$32k WoW" }}
        />
        <StatCard
          label="Available Credit"
          value={formatMoney(115_500)}
          subtext="28.9% available"
          icon={CircleDollarSign}
          trend={{ direction: "down", value: "−8.1%" }}
        />
        <StatCard
          label="Active Vehicles"
          value="23"
          subtext="in inventory"
          icon={Car}
          trend={{ direction: "up", value: "+2" }}
        />
        <StatCard
          label="Avg Days on Lot"
          value="47"
          subtext="across active inventory"
          icon={Clock}
          accent="amber"
          trend={{ direction: "flat", value: "0d" }}
        />
      </section>

      {/* ── Inventory aging ───────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Inventory aging
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Distribution of your 23 active vehicles by days on lot.
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-muted-foreground tabular-nums">
            Total {formatMoney(TOTAL_AGING_AMOUNT)}
          </span>
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {AGING_BUCKETS.map((b) => (
            <AgingBucketCard
              key={b.range}
              range={b.range}
              vehicles={b.vehicles}
              amount={b.amount}
              share={b.amount / TOTAL_AGING_AMOUNT}
              tone={b.tone}
            />
          ))}
        </div>
      </section>

      {/* ── Two-column: recent activity + oldest inventory ────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Recent transactions */}
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
            <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
              7 days
            </span>
          </div>
          <Separator className="bg-border/60" />
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
              {RECENT_TRANSACTIONS.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="border-border/40 hover:bg-accent/30 transition-colors"
                >
                  <TableCell className="px-5 py-3">
                    <TxBadge type={tx.type} />
                  </TableCell>
                  <TableCell className="py-3 text-[13px] font-medium text-foreground">
                    {tx.vehicle}
                  </TableCell>
                  <TableCell
                    className={`py-3 text-right text-[13px] tabular-nums font-medium ${
                      tx.type === "payoff" ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {tx.type === "payoff" ? "+" : "−"}
                    {formatMoney(tx.amount)}
                  </TableCell>
                  <TableCell className="pr-5 py-3 text-right text-[12.5px] tabular-nums text-muted-foreground">
                    {formatDate(tx.date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Oldest active inventory */}
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
            <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
              Aging
            </span>
          </div>
          <Separator className="bg-border/60" />
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
              {OLDEST_INVENTORY.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-border/40 hover:bg-accent/30 transition-colors"
                >
                  <TableCell className="px-5 py-3 text-[13px] font-medium text-foreground">
                    {row.vehicle}
                  </TableCell>
                  <TableCell className="py-3 text-right text-[13px] tabular-nums text-foreground">
                    {formatMoney(row.purchasePrice)}
                  </TableCell>
                  <TableCell className="pr-5 py-3 text-right">
                    <DaysPill days={row.daysOnLot} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}

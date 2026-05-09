import Link from "next/link"
import { differenceInCalendarDays } from "date-fns"
import { ArrowUpRight, CalendarClock, Clock, Wallet } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { StatCard } from "@/components/stat-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { cn, formatDate, formatMoney, formatProfit } from "@/lib/utils"
import {
  getAvgDaysToPayoff,
  getMonthlyPayoffTotal,
  getPrimaryFloorplan,
} from "@/lib/floorplan"
import { PaymentsRangeTabs } from "./_components/range-tabs"
import { PaymentsPagination } from "./_components/pagination"

const PAGE_SIZE = 25

const RANGE_KEYS = ["30", "90", "365", "all"] as const
type RangeKey = (typeof RANGE_KEYS)[number]

const DEFAULT_RANGE: RangeKey = "90"

type SearchParams = Promise<{ range?: string; page?: string }>

function rangeStart(range: RangeKey): Date | null {
  if (range === "all") return null
  const days = Number(range)
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - days)
  return start
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const range: RangeKey = (RANGE_KEYS as readonly string[]).includes(
    sp.range ?? ""
  )
    ? (sp.range as RangeKey)
    : DEFAULT_RANGE
  const page = Math.max(1, Number(sp.page) || 1)

  const floorplan = await getPrimaryFloorplan()
  if (!floorplan) return null

  const start = rangeStart(range)
  const dateFilter = start ? { date: { gte: start } } : {}

  const where = {
    floorplanLineId: floorplan.id,
    type: "payoff",
    ...dateFilter,
  }

  const [allTimeAgg, monthlyTotal, avgDays, total] = await Promise.all([
    prisma.transaction.aggregate({
      where: { floorplanLineId: floorplan.id, type: "payoff" },
      _sum: { amount: true },
    }),
    getMonthlyPayoffTotal(floorplan.id),
    getAvgDaysToPayoff(floorplan.id),
    prisma.transaction.count({ where }),
  ])

  const totalPaidBackAllTime = Number(allTimeAgg._sum.amount ?? 0)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const skip = (safePage - 1) * PAGE_SIZE

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    skip,
    take: PAGE_SIZE,
    include: {
      vehicle: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          trim: true,
          vin: true,
          purchasePrice: true,
          purchaseDate: true,
          saleDate: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold tracking-tight leading-none">
          Payments
        </h1>
        <p className="text-[13.5px] text-muted-foreground">
          Investor payback log — every car you&rsquo;ve paid off.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard
          label="Total Paid Back"
          value={formatMoney(totalPaidBackAllTime)}
          subtext="all-time payoffs"
          icon={Wallet}
        />
        <StatCard
          label="This Month"
          value={formatMoney(monthlyTotal)}
          subtext={formatDate(new Date(), "MMMM yyyy")}
          icon={ArrowUpRight}
        />
        <StatCard
          label="Avg Days to Payoff"
          value={String(avgDays)}
          subtext="purchase to payoff"
          icon={Clock}
          accent={avgDays >= 60 ? "amber" : "default"}
        />
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PaymentsRangeTabs current={range} />
        <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/70 tabular-nums">
          {total} {total === 1 ? "payoff" : "payoffs"}
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-xl border border-border/70 bg-card/40 px-6 py-20">
          <div className="mx-auto flex max-w-sm flex-col items-center text-center gap-4">
            <span className="grid size-12 place-items-center rounded-xl bg-card border border-border/80 text-muted-foreground">
              <CalendarClock className="size-5" strokeWidth={1.5} />
            </span>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[15px] font-semibold tracking-tight">
                No payments yet
              </h3>
              <p className="text-[12.5px] text-muted-foreground">
                Mark a vehicle as sold to record your first payoff.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border/70 bg-card/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="h-9 px-5 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                    Date
                  </TableHead>
                  <TableHead className="h-9 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                    Vehicle
                  </TableHead>
                  <TableHead className="h-9 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                    VIN
                  </TableHead>
                  <TableHead className="h-9 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                    Amount
                  </TableHead>
                  <TableHead className="h-9 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                    Original Purchase
                  </TableHead>
                  <TableHead className="h-9 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                    Profit
                  </TableHead>
                  <TableHead className="h-9 pr-5 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                    Days on Lot
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const v = tx.vehicle
                  const purchasePrice = v ? Number(v.purchasePrice) : 0
                  const profit =
                    v && v.saleDate
                      ? formatProfit(Number(tx.amount), purchasePrice)
                      : null
                  const days =
                    v && v.saleDate
                      ? Math.max(
                          0,
                          differenceInCalendarDays(
                            v.saleDate,
                            v.purchaseDate
                          )
                        )
                      : null
                  return (
                    <TableRow
                      key={tx.id}
                      className="border-border/40 hover:bg-accent/30 transition-colors"
                    >
                      <TableCell className="px-5 py-3 text-[12.5px] tabular-nums text-muted-foreground">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell className="py-3 text-[13px] font-medium text-foreground">
                        {v ? (
                          <Link
                            href={`/vehicles/${v.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {v.year} {v.make} {v.model}
                            {v.trim ? (
                              <span className="text-muted-foreground"> {v.trim}</span>
                            ) : null}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3" title={v?.vin ?? undefined}>
                        <span className="font-mono text-[12px] text-muted-foreground">
                          {v ? `…${v.vin.slice(-6)}` : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right text-[13px] tabular-nums font-medium text-primary">
                        +{formatMoney(Number(tx.amount))}
                      </TableCell>
                      <TableCell className="py-3 text-right text-[13px] tabular-nums text-foreground">
                        {v ? formatMoney(purchasePrice) : "—"}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {profit ? (
                          <div className="flex flex-col items-end leading-tight">
                            <span
                              className={cn(
                                "text-[13px] tabular-nums font-medium",
                                profit.isProfit
                                  ? "text-primary"
                                  : "text-destructive"
                              )}
                            >
                              {profit.formatted}
                            </span>
                            <span
                              className={cn(
                                "text-[10.5px] tabular-nums",
                                profit.isProfit
                                  ? "text-primary/80"
                                  : "text-destructive/80"
                              )}
                            >
                              {profit.margin.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-5 py-3 text-right text-[12.5px] tabular-nums text-muted-foreground">
                        {days != null ? `${days}d` : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Separator className="bg-border/60" />
          </div>
          <PaymentsPagination page={safePage} totalPages={totalPages} />
        </>
      )}
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { ArrowDownLeft, ArrowUpRight, CalendarClock } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { cn, formatDate, formatMoney } from "@/lib/utils"
import { getPrimaryFloorplan } from "@/lib/floorplan"

export const metadata: Metadata = {
  title: "Transactions – JTrak Funding",
  description: "Every advance, payoff, and adjustment against your line.",
}

const PAGE_SIZE = 50

type SearchParams = Promise<{ type?: string; page?: string }>

const TYPE_TABS = [
  { key: "all", label: "All" },
  { key: "advance", label: "Advances" },
  { key: "payoff", label: "Payoffs" },
  { key: "adjustment", label: "Adjustments" },
] as const

function TxBadge({ type }: { type: string }) {
  if (type === "advance") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-300 font-medium"
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

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const type = TYPE_TABS.some((t) => t.key === sp.type) ? sp.type! : "all"
  const page = Math.max(1, Number(sp.page) || 1)

  const floorplan = await getPrimaryFloorplan()
  if (!floorplan) return null

  const where = {
    floorplanLineId: floorplan.id,
    ...(type !== "all" ? { type } : {}),
  }

  const total = await prisma.transaction.count({ where })
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
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold tracking-tight leading-none">
          Transactions
        </h1>
        <p className="text-[13.5px] text-muted-foreground">
          Every advance, payoff, and adjustment against your floorplan.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex h-8 items-center rounded-lg bg-muted p-[3px] overflow-x-auto">
          {TYPE_TABS.map((t) => {
            const active = type === t.key
            const href =
              t.key === "all"
                ? "/transactions"
                : `/transactions?type=${t.key}`
            return (
              <Link
                key={t.key}
                href={href}
                className={cn(
                  "relative inline-flex h-[calc(100%-1px)] items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-background text-foreground shadow-sm dark:bg-input/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </Link>
            )
          })}
        </div>
        <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/70 tabular-nums">
          {total} {total === 1 ? "transaction" : "transactions"}
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
                No transactions yet
              </h3>
              <p className="text-[12.5px] text-muted-foreground">
                Add a vehicle or mark one sold to see ledger entries here.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border/70 bg-card/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="h-9 px-5 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                  Date
                </TableHead>
                <TableHead className="h-9 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                  Type
                </TableHead>
                <TableHead className="h-9 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                  Vehicle
                </TableHead>
                <TableHead className="h-9 text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                  Description
                </TableHead>
                <TableHead className="h-9 pr-5 text-right text-[10.5px] uppercase tracking-[0.12em] font-medium text-muted-foreground/80">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const v = tx.vehicle
                const isPayoff = tx.type === "payoff"
                return (
                  <TableRow
                    key={tx.id}
                    className="border-border/40 hover:bg-accent/30 transition-colors"
                  >
                    <TableCell className="px-5 py-3 text-[12.5px] tabular-nums text-muted-foreground">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell className="py-3">
                      <TxBadge type={tx.type} />
                    </TableCell>
                    <TableCell className="py-3 text-[13px] text-foreground">
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
                    <TableCell className="py-3 text-[12.5px] text-muted-foreground">
                      {tx.description ?? "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "pr-5 py-3 text-right text-[13px] tabular-nums font-medium",
                        isPayoff ? "text-primary" : "text-foreground"
                      )}
                    >
                      {isPayoff ? "+" : "−"}
                      {formatMoney(Number(tx.amount))}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <Separator className="bg-border/60" />
          {totalPages > 1 ? (
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[11.5px] tabular-nums text-muted-foreground">
                Page {safePage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                {safePage > 1 ? (
                  <Link
                    href={`/transactions?${new URLSearchParams({
                      ...(type !== "all" ? { type } : {}),
                      page: String(safePage - 1),
                    }).toString()}`}
                    className="h-7 inline-flex items-center rounded-md border border-border px-2.5 text-[12px] hover:bg-accent"
                  >
                    Previous
                  </Link>
                ) : null}
                {safePage < totalPages ? (
                  <Link
                    href={`/transactions?${new URLSearchParams({
                      ...(type !== "all" ? { type } : {}),
                      page: String(safePage + 1),
                    }).toString()}`}
                    className="h-7 inline-flex items-center rounded-md border border-border px-2.5 text-[12px] hover:bg-accent"
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

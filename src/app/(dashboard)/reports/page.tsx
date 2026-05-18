import type { Metadata } from "next"

import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subMonths,
  subQuarters,
  subDays,
} from "date-fns"

import {
  getActiveVehiclesAtDate,
  getAllActiveInventory,
  getOutstandingBalanceAtDate,
  getPaidOffVehiclesInRange,
  getPrimaryFloorplan,
  getTransactionsInRange,
} from "@/lib/floorplan"
import { InventoryAgingReport } from "./_components/inventory-aging"
import { InvestorStatement } from "./_components/investor-statement"
import { ProfitReport } from "./_components/profit-report"
import { ReportsTabNav, type ReportTab } from "./_components/tab-nav"
import {
  RangeFilter,
  type RangePreset,
} from "./_components/range-filter"

export const metadata: Metadata = {
  title: "Reports – JTrak Funding",
  description: "Inventory aging, profit, and investor statement reports.",
}

type SearchParams = Promise<{
  tab?: string
  range?: string
  start?: string
  end?: string
}>

const VALID_TABS: ReportTab[] = ["aging", "profit", "statement"]

const PROFIT_PRESETS: Array<{ key: RangePreset; label: string }> = [
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "365", label: "Last 365 days" },
  { key: "ytd", label: "This year" },
  { key: "all", label: "All time" },
  { key: "custom", label: "Custom" },
]

const STATEMENT_PRESETS: Array<{ key: RangePreset; label: string }> = [
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "this_quarter", label: "This quarter" },
  { key: "last_quarter", label: "Last quarter" },
  { key: "this_year", label: "This year" },
  { key: "custom", label: "Custom" },
]

function parseISODate(value: string | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function resolveProfitRange(
  range: RangePreset,
  start?: string,
  end?: string
): { start: Date; end: Date; label: string } {
  const today = endOfDay(new Date())
  switch (range) {
    case "30":
      return {
        start: startOfDay(subDays(today, 30)),
        end: today,
        label: "Last 30 days",
      }
    case "90":
      return {
        start: startOfDay(subDays(today, 90)),
        end: today,
        label: "Last 90 days",
      }
    case "365":
      return {
        start: startOfDay(subDays(today, 365)),
        end: today,
        label: "Last 365 days",
      }
    case "ytd":
      return {
        start: startOfYear(today),
        end: today,
        label: "Year to date",
      }
    case "all":
      return {
        start: new Date(2000, 0, 1),
        end: today,
        label: "All time",
      }
    case "custom": {
      const s = parseISODate(start) ?? startOfDay(subDays(today, 30))
      const e = parseISODate(end) ?? today
      return {
        start: startOfDay(s),
        end: endOfDay(e),
        label: "Custom range",
      }
    }
    default:
      return {
        start: startOfDay(subDays(today, 30)),
        end: today,
        label: "Last 30 days",
      }
  }
}

function resolveStatementRange(
  range: RangePreset,
  start?: string,
  end?: string
): { start: Date; end: Date; label: string } {
  const now = new Date()
  switch (range) {
    case "this_month":
      return {
        start: startOfMonth(now),
        end: endOfDay(endOfMonth(now)),
        label: "This month",
      }
    case "last_month": {
      const lm = subMonths(now, 1)
      return {
        start: startOfMonth(lm),
        end: endOfDay(endOfMonth(lm)),
        label: "Last month",
      }
    }
    case "this_quarter":
      return {
        start: startOfQuarter(now),
        end: endOfDay(endOfQuarter(now)),
        label: "This quarter",
      }
    case "last_quarter": {
      const lq = subQuarters(now, 1)
      return {
        start: startOfQuarter(lq),
        end: endOfDay(endOfQuarter(lq)),
        label: "Last quarter",
      }
    }
    case "this_year":
      return {
        start: startOfYear(now),
        end: endOfDay(endOfYear(now)),
        label: "This year",
      }
    case "custom": {
      const s = parseISODate(start) ?? startOfMonth(now)
      const e = parseISODate(end) ?? endOfMonth(now)
      return {
        start: startOfDay(s),
        end: endOfDay(e),
        label: "Custom range",
      }
    }
    default:
      return {
        start: startOfMonth(now),
        end: endOfDay(endOfMonth(now)),
        label: "This month",
      }
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const tab: ReportTab = VALID_TABS.includes(sp.tab as ReportTab)
    ? (sp.tab as ReportTab)
    : "aging"

  const floorplan = await getPrimaryFloorplan()
  if (!floorplan) return null

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold tracking-tight leading-none">
          Reports
        </h1>
        <p className="text-[13.5px] text-muted-foreground">
          Generate reports for accounting, taxes, or investor review.
        </p>
      </header>

      <ReportsTabNav current={tab} />

      {tab === "aging" ? (
        <AgingTab />
      ) : tab === "profit" ? (
        <ProfitTab
          range={(sp.range as RangePreset) || "30"}
          start={sp.start}
          end={sp.end}
        />
      ) : (
        <StatementTab
          floorplanId={floorplan.id}
          floorplanName={floorplan.name}
          investorName={floorplan.investor.name}
          range={(sp.range as RangePreset) || "this_month"}
          start={sp.start}
          end={sp.end}
        />
      )}
    </div>
  )
}

async function AgingTab() {
  const floorplan = await getPrimaryFloorplan()
  if (!floorplan) return null
  const vehicles = await getAllActiveInventory(floorplan.id)
  const asOfDate = new Date()
  return (
    <InventoryAgingReport
      asOfDate={asOfDate}
      vehicles={vehicles.map((v) => ({
        id: v.id,
        stockNumber: v.stockNumber,
        vin: v.vin,
        year: v.year,
        make: v.make,
        model: v.model,
        trim: v.trim,
        purchasePrice: Number(v.purchasePrice),
        purchaseDate: v.purchaseDate,
        source: v.source,
      }))}
    />
  )
}

async function ProfitTab({
  range,
  start,
  end,
}: {
  range: RangePreset
  start?: string
  end?: string
}) {
  const floorplan = await getPrimaryFloorplan()
  if (!floorplan) return null
  const resolved = resolveProfitRange(range, start, end)
  const vehicles = await getPaidOffVehiclesInRange(
    floorplan.id,
    resolved.start,
    resolved.end
  )
  return (
    <>
      <RangeFilter
        presets={PROFIT_PRESETS}
        current={range}
        customStart={start}
        customEnd={end}
      />
      <ProfitReport
        rangeStart={resolved.start}
        rangeEnd={resolved.end}
        rangeLabel={resolved.label}
        vehicles={vehicles.map((v) => ({
          id: v.id,
          stockNumber: v.stockNumber,
          vin: v.vin,
          year: v.year,
          make: v.make,
          model: v.model,
          trim: v.trim,
          source: v.source,
          purchasePrice: Number(v.purchasePrice),
          purchaseDate: v.purchaseDate,
          salePrice: v.salePrice != null ? Number(v.salePrice) : null,
          saleDate: v.saleDate,
          buyerName: v.buyerName,
        }))}
      />
    </>
  )
}

async function StatementTab({
  floorplanId,
  floorplanName,
  investorName,
  range,
  start,
  end,
}: {
  floorplanId: string
  floorplanName: string
  investorName: string
  range: RangePreset
  start?: string
  end?: string
}) {
  const resolved = resolveStatementRange(range, start, end)
  // Starting balance = balance on the day BEFORE rangeStart (i.e. lte day prior)
  const beforeStart = new Date(resolved.start.getTime() - 1)
  const [startingBalance, endingBalance, transactions, outstanding] =
    await Promise.all([
      getOutstandingBalanceAtDate(floorplanId, beforeStart),
      getOutstandingBalanceAtDate(floorplanId, resolved.end),
      getTransactionsInRange(floorplanId, resolved.start, resolved.end),
      getActiveVehiclesAtDate(floorplanId, resolved.end),
    ])

  return (
    <>
      <RangeFilter
        presets={STATEMENT_PRESETS}
        current={range}
        customStart={start}
        customEnd={end}
      />
      <InvestorStatement
        investorName={investorName}
        floorplanName={floorplanName}
        rangeStart={resolved.start}
        rangeEnd={resolved.end}
        startingBalance={startingBalance}
        endingBalance={endingBalance}
        transactions={transactions.map((tx) => ({
          id: tx.id,
          date: tx.date,
          type: tx.type,
          amount: Number(tx.amount),
          description: tx.description,
          vehicle: tx.vehicle,
        }))}
        outstandingAtEnd={outstanding.map((v) => ({
          id: v.id,
          vin: v.vin,
          year: v.year,
          make: v.make,
          model: v.model,
          trim: v.trim,
          stockNumber: v.stockNumber,
          purchaseDate: v.purchaseDate,
          purchasePrice: Number(v.purchasePrice),
          advanceAmount: Number(v.advanceAmount),
        }))}
      />
    </>
  )
}

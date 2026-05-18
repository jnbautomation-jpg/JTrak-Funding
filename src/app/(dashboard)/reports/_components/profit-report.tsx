import { differenceInCalendarDays } from "date-fns"
import { TrendingUp } from "lucide-react"

import { StatCard } from "@/components/stat-card"
import { cn, formatDate, formatMoney, formatProfit } from "@/lib/utils"
import { CsvExportButton, PrintButton } from "./exporters"
import { ReportEmpty } from "./empty"

export type ProfitVehicle = {
  id: string
  stockNumber: string | null
  vin: string
  year: number
  make: string
  model: string
  trim: string | null
  source: string | null
  purchasePrice: number
  purchaseDate: Date
  salePrice: number | null
  saleDate: Date | null
  buyerName: string | null
}

export function ProfitReport({
  vehicles,
  rangeStart,
  rangeEnd,
  rangeLabel,
}: {
  vehicles: ProfitVehicle[]
  rangeStart: Date
  rangeEnd: Date
  rangeLabel: string
}) {
  const rows = vehicles
    .map((v) => {
      const sale = v.salePrice ?? 0
      const purchase = v.purchasePrice
      const profit = sale - purchase
      const margin = purchase > 0 ? (profit / purchase) * 100 : 0
      const days =
        v.saleDate != null
          ? Math.max(0, differenceInCalendarDays(v.saleDate, v.purchaseDate))
          : 0
      return { v, sale, purchase, profit, margin, days }
    })
    .sort((a, b) => {
      const aDate = a.v.saleDate?.getTime() ?? 0
      const bDate = b.v.saleDate?.getTime() ?? 0
      return bDate - aDate
    })

  const totalCount = rows.length
  const totalRevenue = rows.reduce((acc, r) => acc + r.sale, 0)
  const totalCost = rows.reduce((acc, r) => acc + r.purchase, 0)
  const totalProfit = totalRevenue - totalCost
  const avgProfit = totalCount > 0 ? totalProfit / totalCount : 0
  const avgMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
  const avgDays =
    totalCount > 0
      ? Math.round(rows.reduce((acc, r) => acc + r.days, 0) / totalCount)
      : 0

  const csvHeaders = [
    "Stock #",
    "VIN",
    "Year",
    "Make",
    "Model",
    "Trim",
    "Source",
    "Purchase Date",
    "Purchase Price",
    "Sale Date",
    "Sale Price",
    "Buyer",
    "Days on Lot",
    "Profit",
    "Margin %",
  ]
  const csvRows = rows.map(({ v, sale, purchase, profit, margin, days }) => [
    v.stockNumber ?? "",
    v.vin,
    v.year,
    v.make,
    v.model,
    v.trim ?? "",
    v.source ?? "",
    v.purchaseDate ? formatDate(v.purchaseDate, "yyyy-MM-dd") : "",
    purchase,
    v.saleDate ? formatDate(v.saleDate, "yyyy-MM-dd") : "",
    sale,
    v.buyerName ?? "",
    days,
    profit,
    margin.toFixed(1),
  ])

  const filename = `profit-report-${formatDate(rangeEnd, "yyyy-MM-dd")}.csv`

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-[12.5px] text-muted-foreground">
          {rangeLabel} ({formatDate(rangeStart)} – {formatDate(rangeEnd)})
        </p>
        <div className="flex items-center gap-2">
          <CsvExportButton
            filename={filename}
            headers={csvHeaders}
            rows={csvRows}
          />
          <PrintButton title={`Profit Report — ${formatDate(rangeEnd)}`} />
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 print:hidden">
        <StatCard
          label="Cars Sold"
          value={String(totalCount)}
          subtext={rangeLabel.toLowerCase()}
        />
        <StatCard
          label="Total Revenue"
          value={formatMoney(totalRevenue)}
          subtext="gross sales"
        />
        <StatCard
          label="Total Cost"
          value={formatMoney(totalCost)}
          subtext="purchase prices"
        />
        <StatCard
          label="Total Profit"
          value={formatMoney(totalProfit)}
          subtext={`${avgMargin.toFixed(1)}% avg margin`}
          icon={TrendingUp}
          accent={totalProfit < 0 ? "red" : "default"}
        />
      </div>

      <div className="grid gap-3 grid-cols-3 print:hidden">
        <StatCard
          label="Avg Profit / Car"
          value={formatMoney(avgProfit)}
          subtext="per unit"
        />
        <StatCard
          label="Avg Margin"
          value={`${avgMargin.toFixed(1)}%`}
          subtext="profit / cost"
        />
        <StatCard
          label="Avg Days on Lot"
          value={`${avgDays}d`}
          subtext="purchase to sale"
        />
      </div>

      {rows.length === 0 ? (
        <ReportEmpty subtitle="No cars were paid off in this date range." />
      ) : (
        <div className="print-document">
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold">Profit Report</h1>
            <p className="text-sm mt-1">
              {rangeLabel} ({formatDate(rangeStart)} – {formatDate(rangeEnd)})
            </p>
            <p className="text-sm">
              {totalCount} cars · Revenue {formatMoney(totalRevenue)} · Profit{" "}
              {formatMoney(totalProfit)} · Margin {avgMargin.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/60 overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/80 border-b border-border/60">
                  <th className="font-medium px-4 py-2.5">Stock</th>
                  <th className="font-medium py-2.5">Vehicle</th>
                  <th className="font-medium py-2.5">Source</th>
                  <th className="font-medium py-2.5">Purchased</th>
                  <th className="font-medium py-2.5">Sold</th>
                  <th className="font-medium py-2.5 text-right">Days</th>
                  <th className="font-medium py-2.5 text-right">Profit</th>
                  <th className="font-medium pr-4 py-2.5 text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ v, sale, purchase, profit, margin, days }) => {
                  const isProfit = profit >= 0
                  return (
                    <tr
                      key={v.id}
                      className="border-t border-border/40"
                    >
                      <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                        {v.stockNumber || "—"}
                      </td>
                      <td className="py-2.5 font-medium text-foreground">
                        {v.year} {v.make} {v.model}
                        {v.trim ? (
                          <span className="text-muted-foreground">
                            {" "}
                            {v.trim}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {v.source || "—"}
                      </td>
                      <td className="py-2.5 text-muted-foreground tabular-nums">
                        <div className="flex flex-col leading-tight">
                          <span>{formatDate(v.purchaseDate)}</span>
                          <span className="text-[10.5px]">
                            {formatMoney(purchase)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-muted-foreground tabular-nums">
                        <div className="flex flex-col leading-tight">
                          <span>
                            {v.saleDate ? formatDate(v.saleDate) : "—"}
                          </span>
                          <span className="text-[10.5px]">
                            {formatMoney(sale)}
                            {v.buyerName ? ` · ${v.buyerName}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                        {days}d
                      </td>
                      <td
                        className={cn(
                          "py-2.5 text-right tabular-nums font-medium",
                          isProfit
                            ? "text-primary print-positive"
                            : "text-destructive print-negative"
                        )}
                      >
                        {formatProfit(sale, purchase).formatted}
                      </td>
                      <td
                        className={cn(
                          "pr-4 py-2.5 text-right tabular-nums",
                          isProfit
                            ? "text-primary print-positive"
                            : "text-destructive print-negative"
                        )}
                      >
                        {margin.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

import { differenceInCalendarDays } from "date-fns"
import { Car } from "lucide-react"

import { StatCard } from "@/components/stat-card"
import { Separator } from "@/components/ui/separator"
import { cn, formatDate, formatMoney } from "@/lib/utils"
import { CsvExportButton, PrintButton } from "./exporters"
import { ReportEmpty } from "./empty"

type AgingVehicle = {
  id: string
  stockNumber: string | null
  vin: string
  year: number
  make: string
  model: string
  trim: string | null
  purchasePrice: number
  purchaseDate: Date
  source: string | null
  daysOnLot: number
}

type BucketKey = "0-30" | "31-60" | "61-90" | "90+"

const BUCKET_LABELS: Record<BucketKey, string> = {
  "0-30": "0–30 days",
  "31-60": "31–60 days",
  "61-90": "61–90 days",
  "90+": "90+ days",
}

const BUCKET_TONE: Record<BucketKey, string> = {
  "0-30": "border-primary/30 bg-primary/5",
  "31-60": "border-border/70",
  "61-90": "border-amber-400/30 bg-amber-400/5",
  "90+": "border-destructive/30 bg-destructive/5",
}

function bucketize(days: number): BucketKey {
  if (days >= 90) return "90+"
  if (days >= 60) return "61-90"
  if (days >= 30) return "31-60"
  return "0-30"
}

export function InventoryAgingReport({
  vehicles,
  asOfDate,
}: {
  vehicles: Array<{
    id: string
    stockNumber: string | null
    vin: string
    year: number
    make: string
    model: string
    trim: string | null
    purchasePrice: number
    purchaseDate: Date
    source: string | null
  }>
  asOfDate: Date
}) {
  const enriched: AgingVehicle[] = vehicles.map((v) => ({
    ...v,
    daysOnLot: Math.max(0, differenceInCalendarDays(asOfDate, v.purchaseDate)),
  }))

  const totalOutstanding = enriched.reduce((acc, v) => acc + v.purchasePrice, 0)
  const avgDays =
    enriched.length > 0
      ? Math.round(
          enriched.reduce((acc, v) => acc + v.daysOnLot, 0) / enriched.length
        )
      : 0

  const buckets: Record<BucketKey, AgingVehicle[]> = {
    "0-30": [],
    "31-60": [],
    "61-90": [],
    "90+": [],
  }
  for (const v of enriched) {
    buckets[bucketize(v.daysOnLot)].push(v)
  }
  for (const k of Object.keys(buckets) as BucketKey[]) {
    buckets[k].sort((a, b) => b.daysOnLot - a.daysOnLot)
  }

  const csvHeaders = [
    "Bucket",
    "Stock #",
    "VIN",
    "Year",
    "Make",
    "Model",
    "Trim",
    "Purchase Price",
    "Days on Lot",
    "Source",
    "Purchase Date",
  ]
  const csvRows = enriched
    .slice()
    .sort((a, b) => b.daysOnLot - a.daysOnLot)
    .map((v) => [
      BUCKET_LABELS[bucketize(v.daysOnLot)],
      v.stockNumber ?? "",
      v.vin,
      v.year,
      v.make,
      v.model,
      v.trim ?? "",
      v.purchasePrice,
      v.daysOnLot,
      v.source ?? "",
      formatDate(v.purchaseDate, "yyyy-MM-dd"),
    ])

  const filename = `inventory-aging-${formatDate(asOfDate, "yyyy-MM-dd")}.csv`

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-[12.5px] text-muted-foreground">
          As of {formatDate(asOfDate, "MMM d, yyyy")}
        </p>
        <div className="flex items-center gap-2">
          <CsvExportButton
            filename={filename}
            headers={csvHeaders}
            rows={csvRows}
          />
          <PrintButton title={`Inventory Aging — ${formatDate(asOfDate)}`} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 print:hidden">
        <StatCard
          label="Total Active Vehicles"
          value={String(enriched.length)}
          subtext="in inventory"
          icon={Car}
        />
        <StatCard
          label="Total Outstanding"
          value={formatMoney(totalOutstanding)}
          subtext="advance amount"
        />
        <StatCard
          label="Avg Days on Lot"
          value={`${avgDays}d`}
          subtext={avgDays >= 60 ? "aging fast" : "looks healthy"}
          accent={avgDays >= 60 ? "amber" : "default"}
        />
      </div>

      {enriched.length === 0 ? (
        <ReportEmpty subtitle="No active inventory to report on yet." />
      ) : (
        <div className="print-document space-y-6">
          {/* Print-only document header */}
          <div className="hidden print:block">
            <h1 className="text-2xl font-bold">Inventory Aging Report</h1>
            <p className="text-sm mt-1">
              As of {formatDate(asOfDate, "MMMM d, yyyy")}
            </p>
            <p className="text-sm">
              {enriched.length} active vehicles · Total outstanding{" "}
              {formatMoney(totalOutstanding)} · Avg {avgDays}d on lot
            </p>
          </div>

          {(["0-30", "31-60", "61-90", "90+"] as BucketKey[]).map((key) => {
            const rows = buckets[key]
            const bucketTotal = rows.reduce((acc, v) => acc + v.purchasePrice, 0)
            return (
              <section
                key={key}
                className={cn(
                  "rounded-lg border overflow-hidden",
                  BUCKET_TONE[key]
                )}
              >
                <header className="flex items-center justify-between px-5 py-3">
                  <h3 className="text-[14px] font-semibold tracking-tight">
                    {BUCKET_LABELS[key]}
                  </h3>
                  <div className="flex items-center gap-4 text-[12px] text-muted-foreground tabular-nums">
                    <span>
                      {rows.length} {rows.length === 1 ? "vehicle" : "vehicles"}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatMoney(bucketTotal)}
                    </span>
                  </div>
                </header>
                {rows.length === 0 ? (
                  <>
                    <Separator className="bg-border/60" />
                    <p className="px-5 py-6 text-center text-[12px] text-muted-foreground">
                      Nothing in this bucket.
                    </p>
                  </>
                ) : (
                  <>
                    <Separator className="bg-border/60" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12.5px]">
                        <thead>
                          <tr className="text-left text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/80">
                            <th className="font-medium px-5 py-2">Stock #</th>
                            <th className="font-medium py-2">VIN</th>
                            <th className="font-medium py-2">Vehicle</th>
                            <th className="font-medium py-2 text-right">
                              Purchase
                            </th>
                            <th className="font-medium py-2 text-right">
                              Days
                            </th>
                            <th className="font-medium pr-5 py-2 text-right">
                              Source
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((v) => (
                            <tr
                              key={v.id}
                              className="border-t border-border/40"
                            >
                              <td className="px-5 py-2.5 tabular-nums text-muted-foreground">
                                {v.stockNumber || "—"}
                              </td>
                              <td className="py-2.5">
                                <span className="font-mono text-[11.5px] text-muted-foreground">
                                  …{v.vin.slice(-6)}
                                </span>
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
                              <td className="py-2.5 text-right tabular-nums">
                                {formatMoney(v.purchasePrice)}
                              </td>
                              <td className="py-2.5 text-right tabular-nums">
                                {v.daysOnLot}d
                              </td>
                              <td className="pr-5 py-2.5 text-right text-muted-foreground">
                                {v.source || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

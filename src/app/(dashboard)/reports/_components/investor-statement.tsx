import { differenceInCalendarDays } from "date-fns"

import { StatCard } from "@/components/stat-card"
import { cn, formatDate, formatMoney } from "@/lib/utils"
import { CsvExportButton, PdfExportButton, PrintButton } from "./exporters"

type StatementVehicle = {
  id: string
  vin: string
  year: number
  make: string
  model: string
  trim: string | null
  stockNumber: string | null
  purchaseDate: Date
  purchasePrice: number
  advanceAmount: number
}

type StatementTransaction = {
  id: string
  date: Date
  type: string
  amount: number
  description: string | null
  vehicle: {
    id: string
    year: number
    make: string
    model: string
    trim: string | null
    vin: string
    stockNumber: string | null
  } | null
}

export function InvestorStatement({
  investorName,
  floorplanName,
  rangeStart,
  rangeEnd,
  startingBalance,
  endingBalance,
  transactions,
  outstandingAtEnd,
}: {
  investorName: string
  floorplanName: string
  rangeStart: Date
  rangeEnd: Date
  startingBalance: number
  endingBalance: number
  transactions: StatementTransaction[]
  outstandingAtEnd: StatementVehicle[]
}) {
  const netChange = endingBalance - startingBalance
  const netDirection = netChange >= 0 ? "up" : "down"

  // Build the activity log with running balance, sorted ascending.
  const sorted = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )
  let running = startingBalance
  const ledger = sorted.map((tx) => {
    const sign = tx.type === "advance" ? 1 : tx.type === "payoff" ? -1 : 1
    running += sign * tx.amount
    return {
      ...tx,
      running: Math.max(0, running),
    }
  })

  const generatedOn = new Date()

  // Filename uses end date — descriptive of the period closed.
  const pdfFilename = `JTrak-Funding-Investor-Statement-${formatDate(
    rangeEnd,
    "yyyy-MM-dd"
  )}.pdf`

  const csvHeaders = ["Date", "Type", "Vehicle", "Amount", "Running Balance"]
  const csvRows = ledger.map((tx) => [
    formatDate(tx.date, "yyyy-MM-dd"),
    tx.type,
    tx.vehicle
      ? `${tx.vehicle.year} ${tx.vehicle.make} ${tx.vehicle.model}`
      : tx.description ?? "",
    tx.amount,
    tx.running,
  ])
  const csvFilename = `investor-statement-${formatDate(rangeEnd, "yyyy-MM-dd")}.csv`

  const totalOutstanding = outstandingAtEnd.reduce(
    (acc, v) => acc + v.advanceAmount,
    0
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between no-print">
        <p className="text-[12.5px] text-muted-foreground">
          {formatDate(rangeStart)} – {formatDate(rangeEnd)}
        </p>
        <div className="flex items-center gap-2">
          <CsvExportButton
            filename={csvFilename}
            headers={csvHeaders}
            rows={csvRows}
          />
          <PrintButton
            title={`Investor Statement — ${formatDate(rangeEnd)}`}
          />
          <PdfExportButton filename={pdfFilename} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 print:hidden">
        <StatCard
          label="Starting Balance"
          value={formatMoney(startingBalance)}
          subtext={`as of ${formatDate(rangeStart)}`}
        />
        <StatCard
          label="Ending Balance"
          value={formatMoney(endingBalance)}
          subtext={`as of ${formatDate(rangeEnd)}`}
        />
        <StatCard
          label="Net Change"
          value={`${netChange >= 0 ? "+" : "−"}${formatMoney(
            Math.abs(netChange)
          )}`}
          subtext={
            netDirection === "up" ? "balance increased" : "balance decreased"
          }
          accent={netChange < 0 ? "default" : "amber"}
        />
      </div>

      <div className="print-document rounded-xl border border-border/70 bg-card/40 print:border-0 print:bg-transparent print:rounded-none">
        <div className="border-b border-border/60 px-6 py-6 print:px-0 print:py-0 print:mb-4 print:border-b-2 print:border-black">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground print:text-black">
            JTrak Funding · {floorplanName}
          </p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight print:text-3xl">
            Floorplan Statement
          </h2>
          <p className="mt-1.5 text-[14px] text-foreground/90 print:text-base">
            {investorName}
          </p>
          <div className="mt-3 flex flex-col gap-1 text-[12px] text-muted-foreground print:text-black">
            <p>
              Period:{" "}
              <span className="text-foreground tabular-nums print:text-black">
                {formatDate(rangeStart, "MMMM d, yyyy")} –{" "}
                {formatDate(rangeEnd, "MMMM d, yyyy")}
              </span>
            </p>
            <p>
              Generated on:{" "}
              <span className="text-foreground tabular-nums print:text-black">
                {formatDate(generatedOn, "MMMM d, yyyy")}
              </span>
            </p>
          </div>
        </div>

        {/* Summary block — repeated for print since stat cards are hidden */}
        <div className="hidden print:block px-6 py-4">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="font-medium">Starting Balance</td>
                <td className="text-right tabular-nums">
                  {formatMoney(startingBalance)}
                </td>
              </tr>
              <tr>
                <td className="font-medium">Ending Balance</td>
                <td className="text-right tabular-nums">
                  {formatMoney(endingBalance)}
                </td>
              </tr>
              <tr>
                <td className="font-medium">Net Change</td>
                <td
                  className={cn(
                    "text-right tabular-nums",
                    netChange >= 0 ? "print-positive" : "print-negative"
                  )}
                >
                  {netChange >= 0 ? "+" : "−"}
                  {formatMoney(Math.abs(netChange))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="px-6 py-5 print:px-0">
          <h3 className="text-[14px] font-semibold tracking-tight print:text-lg">
            Activity
          </h3>
          {ledger.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              No transactions during this period.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border/60 print:border-0 print:mt-2">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-left text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/80 border-b border-border/60">
                    <th className="font-medium px-4 py-2.5">Date</th>
                    <th className="font-medium py-2.5">Type</th>
                    <th className="font-medium py-2.5">Vehicle</th>
                    <th className="font-medium py-2.5 text-right">Amount</th>
                    <th className="font-medium pr-4 py-2.5 text-right">
                      Running Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((tx) => {
                    const isAdvance = tx.type === "advance"
                    return (
                      <tr key={tx.id} className="border-t border-border/40">
                        <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                          {formatDate(tx.date)}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-medium",
                              isAdvance
                                ? "border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-300"
                                : "border-primary/30 bg-primary/10 text-primary"
                            )}
                          >
                            {isAdvance ? "Advance" : "Payoff"}
                          </span>
                        </td>
                        <td className="py-2.5 text-foreground">
                          {tx.vehicle ? (
                            <>
                              {tx.vehicle.year} {tx.vehicle.make}{" "}
                              {tx.vehicle.model}
                              {tx.vehicle.trim ? (
                                <span className="text-muted-foreground">
                                  {" "}
                                  {tx.vehicle.trim}
                                </span>
                              ) : null}
                              <span className="ml-2 text-muted-foreground font-mono text-[10.5px]">
                                …{tx.vehicle.vin.slice(-6)}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">
                              {tx.description ?? "—"}
                            </span>
                          )}
                        </td>
                        <td
                          className={cn(
                            "py-2.5 text-right tabular-nums font-medium",
                            isAdvance
                              ? "text-foreground"
                              : "text-primary print-positive"
                          )}
                        >
                          {isAdvance ? "−" : "+"}
                          {formatMoney(tx.amount)}
                        </td>
                        <td className="pr-4 py-2.5 text-right tabular-nums text-foreground">
                          {formatMoney(tx.running)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="px-6 py-5 border-t border-border/60 print:px-0 print:border-t-2 print:border-black print:mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold tracking-tight print:text-lg">
              Vehicles Outstanding
            </h3>
            <p className="text-[11.5px] text-muted-foreground tabular-nums">
              Snapshot as of {formatDate(rangeEnd)}
            </p>
          </div>
          {outstandingAtEnd.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              No vehicles outstanding at period end.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border/60 print:border-0">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-left text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/80 border-b border-border/60">
                    <th className="font-medium px-4 py-2.5">Stock #</th>
                    <th className="font-medium py-2.5">Vehicle</th>
                    <th className="font-medium py-2.5">VIN</th>
                    <th className="font-medium py-2.5 text-right">Purchased</th>
                    <th className="font-medium py-2.5 text-right">Days</th>
                    <th className="font-medium pr-4 py-2.5 text-right">
                      Advance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingAtEnd.map((v) => {
                    const days = Math.max(
                      0,
                      differenceInCalendarDays(rangeEnd, v.purchaseDate)
                    )
                    return (
                      <tr key={v.id} className="border-t border-border/40">
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
                        <td className="py-2.5">
                          <span className="font-mono text-[11.5px] text-muted-foreground">
                            …{v.vin.slice(-6)}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground tabular-nums">
                          {formatDate(v.purchaseDate)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                          {days}d
                        </td>
                        <td className="pr-4 py-2.5 text-right tabular-nums font-medium text-foreground">
                          {formatMoney(v.advanceAmount)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t-2 border-border/60 bg-muted/30">
                    <td colSpan={5} className="px-4 py-2.5 text-right text-[11.5px] uppercase tracking-[0.12em] text-muted-foreground/80 font-medium">
                      Total Outstanding
                    </td>
                    <td className="pr-4 py-2.5 text-right tabular-nums font-semibold text-foreground">
                      {formatMoney(totalOutstanding)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="hidden print:block px-6 py-4 border-t border-black mt-6 text-xs text-center">
          JTrak Funding · {floorplanName} · Generated{" "}
          {formatDate(generatedOn, "MMMM d, yyyy")}
        </footer>
      </div>
    </div>
  )
}

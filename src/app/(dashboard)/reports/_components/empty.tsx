import { Inbox } from "lucide-react"

export function ReportEmpty({ subtitle }: { subtitle?: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/40 px-6 py-16">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-card border border-border/80 text-muted-foreground">
          <Inbox className="size-5" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[15px] font-semibold tracking-tight">
            No data for this date range
          </h3>
          <p className="text-[12.5px] text-muted-foreground">
            {subtitle ?? "Try widening the range or adding inventory."}
          </p>
        </div>
      </div>
    </div>
  )
}

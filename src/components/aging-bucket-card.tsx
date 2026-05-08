import * as React from "react"
import { cn, formatMoney } from "@/lib/utils"

type AgingTone = "good" | "neutral" | "warning" | "bad"

type AgingBucketCardProps = {
  range: string
  vehicles: number
  amount: number
  share: number // 0..1 of total inventory $
  tone: AgingTone
  className?: string
}

const TONES: Record<
  AgingTone,
  {
    label: string
    dot: string
    bar: string
    barTrack: string
    border: string
  }
> = {
  good: {
    label: "Healthy",
    dot: "bg-primary shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_22%,transparent)]",
    bar: "bg-primary",
    barTrack: "bg-primary/15",
    border: "border-border/70 hover:border-primary/40",
  },
  neutral: {
    label: "On track",
    dot: "bg-muted-foreground/70",
    bar: "bg-muted-foreground/70",
    barTrack: "bg-muted/70",
    border: "border-border/70 hover:border-border",
  },
  warning: {
    label: "Aging",
    dot: "bg-amber-400 shadow-[0_0_0_3px_color-mix(in_oklch,oklch(0.83_0.15_85)_22%,transparent)]",
    bar: "bg-amber-400",
    barTrack: "bg-amber-400/15",
    border: "border-border/70 hover:border-amber-400/40",
  },
  bad: {
    label: "Overdue",
    dot: "bg-destructive shadow-[0_0_0_3px_color-mix(in_oklch,var(--destructive)_22%,transparent)]",
    bar: "bg-destructive",
    barTrack: "bg-destructive/15",
    border: "border-border/70 hover:border-destructive/40",
  },
}

export function AgingBucketCard({
  range,
  vehicles,
  amount,
  share,
  tone,
  className,
}: AgingBucketCardProps) {
  const t = TONES[tone]
  const pct = Math.round(share * 100)

  return (
    <div
      className={cn(
        "group flex flex-col gap-4 rounded-lg border bg-card/60 p-4 transition-colors",
        t.border,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full", t.dot)} aria-hidden />
          <span className="text-[12px] font-medium tracking-tight text-foreground">
            {range}
          </span>
        </div>
        <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {t.label}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[22px] font-semibold tabular-nums leading-none text-foreground">
          {vehicles}
          <span className="ml-1 text-[12px] font-normal text-muted-foreground">
            {vehicles === 1 ? "car" : "cars"}
          </span>
        </span>
        <span className="text-[13px] tabular-nums font-medium text-foreground">
          {formatMoney(amount)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className={cn("h-1 flex-1 overflow-hidden rounded-full", t.barTrack)}>
          <div
            className={cn("h-full rounded-full transition-all", t.bar)}
            style={{ width: `${Math.max(2, pct)}%` }}
          />
        </div>
        <span className="text-[10.5px] tabular-nums text-muted-foreground w-9 text-right">
          {pct}%
        </span>
      </div>
    </div>
  )
}

import * as React from "react"
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type Trend = "up" | "down" | "flat"

type StatCardProps = {
  label: string
  value: string
  subtext?: string
  icon?: LucideIcon
  trend?: { direction: Trend; value: string }
  accent?: "default" | "amber" | "red"
  className?: string
  /** Optional 0-indexed position for stagger animation. */
  index?: number
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  accent = "default",
  className,
  index,
}: StatCardProps) {
  const sheen =
    accent === "amber"
      ? "stat-sheen-amber"
      : accent === "red"
      ? "stat-sheen-red"
      : "stat-sheen"

  const animationStyle =
    index != null ? { animationDelay: `${index * 50}ms` } : undefined

  return (
    <div
      style={animationStyle}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-lg border border-border/70 p-5 min-h-[148px]",
        "transition-colors hover:border-border",
        index != null && "animate-fade-up",
        sheen,
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
          {label}
        </span>
        {Icon ? (
          <span className="grid size-7 place-items-center rounded-md bg-card/80 ring-1 ring-border/70 text-muted-foreground">
            <Icon className="size-3.5" strokeWidth={1.75} />
          </span>
        ) : null}
      </div>
      <div className="mt-5">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-semibold tracking-tight tabular-nums leading-none text-foreground">
            {value}
          </span>
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums",
                trend.direction === "up" && "text-primary",
                trend.direction === "down" && "text-destructive",
                trend.direction === "flat" && "text-muted-foreground"
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="size-3" />
              ) : trend.direction === "down" ? (
                <ArrowDownRight className="size-3" />
              ) : null}
              {trend.value}
            </span>
          ) : null}
        </div>
        {subtext ? (
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            {subtext}
          </p>
        ) : null}
      </div>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-px right-0 h-px w-1/2 bg-gradient-to-l from-primary/40 to-transparent opacity-0 transition-opacity",
          "group-hover:opacity-100"
        )}
      />
    </div>
  )
}

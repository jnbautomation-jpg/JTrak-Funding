import * as React from "react"
import { Sparkles, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type PhasePlaceholderProps = {
  title: string
  subtitle: string
  phase?: string
  icon: LucideIcon
  features: string[]
  className?: string
}

export function PhasePlaceholder({
  title,
  subtitle,
  phase = "Phase 2",
  icon: Icon,
  features,
  className,
}: PhasePlaceholderProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold tracking-tight leading-none">
          {title}
        </h1>
        <p className="text-[13.5px] text-muted-foreground">{subtitle}</p>
      </header>

      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card/40">
        {/* Atmospheric backdrop */}
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          aria-hidden
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[460px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />

        <div className="relative px-6 py-16 sm:py-20 grid place-items-center">
          <div className="flex w-full max-w-md flex-col items-center text-center gap-5">
            <span className="relative grid size-14 place-items-center rounded-xl bg-card border border-border/80 text-foreground">
              <Icon className="size-6" strokeWidth={1.5} />
              <span
                aria-hidden
                className="absolute -inset-px rounded-xl ring-1 ring-primary/20"
              />
            </span>

            <div className="flex flex-col gap-2">
              <span className="inline-flex self-center items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.13em] text-primary">
                <Sparkles className="size-3" />
                Coming in {phase}
              </span>
              <h2 className="text-[18px] font-semibold tracking-tight">
                {title} is on the way
              </h2>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                The foundation is in place. Full functionality lands in {phase} — once
                Supabase auth and the database are wired up, this surface comes alive.
              </p>
            </div>

            <ul className="grid w-full gap-1.5 pt-2">
              {features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 rounded-md border border-border/60 bg-card/50 px-3 py-2 text-[12.5px] text-muted-foreground"
                >
                  <span
                    className="size-1.5 rounded-full bg-primary/70"
                    aria-hidden
                  />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

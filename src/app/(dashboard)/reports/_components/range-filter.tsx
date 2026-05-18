"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export type RangePreset =
  | "30"
  | "90"
  | "365"
  | "ytd"
  | "all"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "custom"

type Props = {
  presets: Array<{ key: RangePreset; label: string }>
  current: RangePreset
  customStart?: string
  customEnd?: string
}

export function RangeFilter({ presets, current, customStart, customEnd }: Props) {
  const router = useRouter()
  const params = useSearchParams()

  function setRange(key: RangePreset, start?: string, end?: string) {
    const next = new URLSearchParams(params.toString())
    next.set("range", key)
    if (key === "custom") {
      if (start) next.set("start", start)
      else next.delete("start")
      if (end) next.set("end", end)
      else next.delete("end")
    } else {
      next.delete("start")
      next.delete("end")
    }
    router.push(`/reports?${next.toString()}`)
  }

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:flex-wrap no-print">
      <div className="inline-flex h-8 items-center rounded-lg bg-muted p-[3px] overflow-x-auto max-w-full">
        {presets.map((p) => {
          const active = current === p.key
          return (
            <button
              key={p.key}
              onClick={() => setRange(p.key)}
              className={cn(
                "relative inline-flex h-[calc(100%-1px)] shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition-colors whitespace-nowrap",
                active
                  ? "bg-background text-foreground shadow-sm dark:bg-input/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {current === "custom" ? (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={customStart ?? ""}
            onChange={(e) => setRange("custom", e.target.value, customEnd)}
            className="h-8 text-[12.5px] w-[150px]"
          />
          <span className="text-muted-foreground text-[11px]">to</span>
          <Input
            type="date"
            value={customEnd ?? ""}
            onChange={(e) => setRange("custom", customStart, e.target.value)}
            className="h-8 text-[12.5px] w-[150px]"
          />
        </div>
      ) : null}
    </div>
  )
}

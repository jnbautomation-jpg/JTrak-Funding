"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"

const TABS: Array<{ key: string; label: string }> = [
  { key: "30", label: "Last 30" },
  { key: "90", label: "Last 90" },
  { key: "365", label: "Last year" },
  { key: "all", label: "All time" },
]

const DEFAULT = "90"

export function PaymentsRangeTabs({ current }: { current: string }) {
  const router = useRouter()
  const params = useSearchParams()

  function setRange(key: string) {
    const next = new URLSearchParams(params.toString())
    if (key === DEFAULT) next.delete("range")
    else next.set("range", key)
    next.delete("page")
    const search = next.toString()
    router.push(search ? `/payments?${search}` : "/payments")
  }

  return (
    <div className="inline-flex h-8 items-center rounded-lg bg-muted p-[3px]">
      {TABS.map((t) => {
        const active = current === t.key
        return (
          <button
            key={t.key}
            onClick={() => setRange(t.key)}
            className={cn(
              "relative inline-flex h-[calc(100%-1px)] items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm dark:bg-input/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"

export type ReportTab = "aging" | "profit" | "statement"

const TABS: Array<{
  key: ReportTab
  label: string
  short: string
}> = [
  { key: "aging", label: "Inventory Aging", short: "Aging" },
  { key: "profit", label: "Profit Report", short: "Profit" },
  { key: "statement", label: "Investor Statement", short: "Statement" },
]

export function ReportsTabNav({ current }: { current: ReportTab }) {
  const router = useRouter()
  const params = useSearchParams()

  function setTab(key: ReportTab) {
    // Reset range params when switching tabs — each tab has its own defaults.
    const next = new URLSearchParams()
    if (key !== "aging") next.set("tab", key)
    const search = next.toString()
    router.push(search ? `/reports?${search}` : "/reports")
  }

  return (
    <div className="inline-flex h-9 items-center rounded-lg bg-muted p-[3px] no-print">
      {TABS.map((t) => {
        const active = current === t.key
        return (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative inline-flex h-[calc(100%-1px)] items-center gap-1.5 rounded-md px-2.5 sm:px-3 text-[12.5px] font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm dark:bg-input/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.short}</span>
          </button>
        )
      })}
    </div>
  )
}

"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TABS: Array<{ key: string; label: string }> = [
  { key: "active", label: "Active" },
  { key: "sold", label: "Sold" },
  { key: "paid_off", label: "Paid Off" },
  { key: "all", label: "All" },
]

const SOURCE_ALL = "__all__"

export function VehiclesToolbar({
  sources,
  total,
}: {
  sources: string[]
  total: number
}) {
  const router = useRouter()
  const params = useSearchParams()
  const tab = params.get("tab") ?? "active"
  const initialQuery = params.get("q") ?? ""
  const sourceFilter = params.get("source") ?? SOURCE_ALL
  const [query, setQuery] = React.useState(initialQuery)

  React.useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString())
    if (!value || value === SOURCE_ALL) next.delete(key)
    else next.set(key, value)
    next.delete("page")
    const search = next.toString()
    router.push(search ? `/vehicles?${search}` : "/vehicles")
  }

  React.useEffect(() => {
    if (query === initialQuery) return
    const handle = setTimeout(() => setParam("q", query.trim() || null), 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="inline-flex h-8 items-center rounded-lg bg-muted p-[3px]">
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setParam("tab", t.key === "active" ? null : t.key)}
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

      <div className="flex flex-1 items-center gap-2 lg:max-w-md lg:justify-end">
        <div className="relative flex-1 lg:flex-initial lg:w-64">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search VIN, stock, year, make, model"
            className="h-8 pl-7 pr-7 text-[12.5px]"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {sources.length > 0 ? (
          <Select
            value={sourceFilter}
            onValueChange={(v) =>
              setParam("source", v === SOURCE_ALL ? null : (v as string))
            }
          >
            <SelectTrigger className="h-8 text-[12.5px] min-w-32">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SOURCE_ALL}>All sources</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <span className="hidden md:inline text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/70 tabular-nums">
          {total} {total === 1 ? "result" : "results"}
        </span>
      </div>
    </div>
  )
}

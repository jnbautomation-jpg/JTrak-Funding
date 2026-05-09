"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PaymentsPagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const params = useSearchParams()

  function goTo(p: number) {
    const next = new URLSearchParams(params.toString())
    if (p <= 1) next.delete("page")
    else next.set("page", String(p))
    const search = next.toString()
    router.push(search ? `/payments?${search}` : "/payments")
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <span className="text-[11.5px] tabular-nums text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
        className="h-7 text-[12px]"
      >
        <ChevronLeft className="size-3.5" />
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
        className="h-7 text-[12px]"
      >
        Next
        <ChevronRight className="size-3.5" />
      </Button>
    </div>
  )
}

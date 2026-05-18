"use client"

import * as React from "react"
import { Download, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

function escapeCsv(value: unknown): string {
  if (value == null) return ""
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const head = headers.map(escapeCsv).join(",")
  const body = rows.map((r) => r.map(escapeCsv).join(",")).join("\n")
  return `${head}\n${body}`
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function CsvExportButton({
  filename,
  headers,
  rows,
  disabled,
}: {
  filename: string
  headers: string[]
  rows: Array<Array<unknown>>
  disabled?: boolean
}) {
  function onClick() {
    const csv = toCsv(headers, rows)
    downloadCsv(filename, csv)
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled || rows.length === 0}
      className="h-8 text-[12px]"
    >
      <Download className="size-3.5" />
      Export CSV
    </Button>
  )
}

export function PrintButton({
  title,
  variant = "outline",
}: {
  title?: string
  variant?: "outline" | "default"
}) {
  function onClick() {
    const previousTitle = document.title
    if (title) document.title = title
    window.print()
    if (title) {
      // Restore after the print dialog dispatches.
      setTimeout(() => {
        document.title = previousTitle
      }, 100)
    }
  }
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      className="h-8 text-[12px]"
    >
      <Printer className="size-3.5" />
      Print
    </Button>
  )
}

export function PdfExportButton({ filename }: { filename: string }) {
  function onClick() {
    const previousTitle = document.title
    // Setting document.title to the desired filename causes most browsers
    // to default the "Save as PDF" filename to that value.
    document.title = filename.replace(/\.pdf$/i, "")
    window.print()
    setTimeout(() => {
      document.title = previousTitle
    }, 100)
  }
  return (
    <Button size="sm" onClick={onClick} className="h-8 text-[12px]">
      <Download className="size-3.5" />
      Export PDF
    </Button>
  )
}

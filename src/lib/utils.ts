import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInCalendarDays } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

const DISPLAY_TZ = "America/New_York"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const moneyFormatterCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export function formatMoney(value: number | string, opts?: { cents?: boolean }) {
  const n = typeof value === "string" ? Number(value) : value
  if (!Number.isFinite(n)) return "—"
  return opts?.cents ? moneyFormatterCents.format(n) : moneyFormatter.format(n)
}

export function formatDate(value: Date | string, pattern = "MMM d, yyyy") {
  const date = typeof value === "string" ? new Date(value) : value
  return formatInTimeZone(date, DISPLAY_TZ, pattern)
}

export function formatDateTime(value: Date | string) {
  return formatDate(value, "MMM d, yyyy 'at' h:mm a")
}

export function daysOnLot(purchaseDate: Date | string, until: Date = new Date()) {
  const start = typeof purchaseDate === "string" ? new Date(purchaseDate) : purchaseDate
  return Math.max(0, differenceInCalendarDays(until, start))
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export type ProfitInfo = {
  amount: number
  margin: number
  isProfit: boolean
  formatted: string
}

export function formatProfit(
  salePrice: number | string,
  purchasePrice: number | string
): ProfitInfo {
  const sale = typeof salePrice === "string" ? Number(salePrice) : salePrice
  const purchase =
    typeof purchasePrice === "string" ? Number(purchasePrice) : purchasePrice
  const amount = (Number.isFinite(sale) ? sale : 0) - (Number.isFinite(purchase) ? purchase : 0)
  const margin = purchase > 0 ? (amount / purchase) * 100 : 0
  const isProfit = amount >= 0
  const sign = amount < 0 ? "−" : ""
  const abs = Math.abs(amount)
  const formatted = `${sign}${moneyFormatter.format(abs)}`
  return { amount, margin, isProfit, formatted }
}

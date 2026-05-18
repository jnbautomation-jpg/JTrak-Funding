import "server-only"
import { differenceInCalendarDays } from "date-fns"

import { prisma } from "@/lib/prisma"

export type AgingBucketKey = "0-30" | "31-60" | "61-90" | "90+"

export type AgingBucket = {
  count: number
  total: number
}

export async function getPrimaryFloorplan() {
  return prisma.floorplanLine.findFirst({
    orderBy: { createdAt: "asc" },
    include: { investor: true },
  })
}

export async function getOutstandingBalance(floorplanLineId: string) {
  const grouped = await prisma.transaction.groupBy({
    by: ["type"],
    where: { floorplanLineId },
    _sum: { amount: true },
  })
  let advances = 0
  let payoffs = 0
  let adjustments = 0
  for (const row of grouped) {
    const sum = Number(row._sum.amount ?? 0)
    if (row.type === "advance") advances += sum
    else if (row.type === "payoff") payoffs += sum
    else if (row.type === "adjustment") adjustments += sum
  }
  return Math.max(0, advances - payoffs + adjustments)
}

export async function getAvailableCredit(
  floorplanLineId: string,
  creditLimit: number
) {
  const outstanding = await getOutstandingBalance(floorplanLineId)
  return creditLimit - outstanding
}

export async function getActiveVehicleCount(floorplanLineId: string) {
  return prisma.vehicle.count({
    where: { floorplanLineId, status: "active" },
  })
}

export async function getAvgDaysOnLot(floorplanLineId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { floorplanLineId, status: "active" },
    select: { purchaseDate: true },
  })
  if (vehicles.length === 0) return 0
  const today = new Date()
  const total = vehicles.reduce(
    (acc, v) => acc + Math.max(0, differenceInCalendarDays(today, v.purchaseDate)),
    0
  )
  return Math.round(total / vehicles.length)
}

export async function getAgingBuckets(
  floorplanLineId: string
): Promise<Record<AgingBucketKey, AgingBucket>> {
  const vehicles = await prisma.vehicle.findMany({
    where: { floorplanLineId, status: "active" },
    select: { purchaseDate: true, advanceAmount: true },
  })
  const buckets: Record<AgingBucketKey, AgingBucket> = {
    "0-30": { count: 0, total: 0 },
    "31-60": { count: 0, total: 0 },
    "61-90": { count: 0, total: 0 },
    "90+": { count: 0, total: 0 },
  }
  const today = new Date()
  for (const v of vehicles) {
    const days = Math.max(0, differenceInCalendarDays(today, v.purchaseDate))
    const amount = Number(v.advanceAmount)
    let key: AgingBucketKey = "0-30"
    if (days >= 90) key = "90+"
    else if (days >= 60) key = "61-90"
    else if (days >= 30) key = "31-60"
    buckets[key].count += 1
    buckets[key].total += amount
  }
  return buckets
}

export async function getRecentTransactions(
  floorplanLineId: string,
  limit = 10
) {
  return prisma.transaction.findMany({
    where: { floorplanLineId },
    orderBy: { date: "desc" },
    take: limit,
    include: {
      vehicle: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          trim: true,
          vin: true,
        },
      },
    },
  })
}

export async function getOldestActiveInventory(
  floorplanLineId: string,
  limit = 5
) {
  return prisma.vehicle.findMany({
    where: { floorplanLineId, status: "active" },
    orderBy: { purchaseDate: "asc" },
    take: limit,
  })
}

export async function getTotalProfitYTD(floorplanLineId: string) {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1)
  const vehicles = await prisma.vehicle.findMany({
    where: {
      floorplanLineId,
      status: "paid_off",
      paidOffDate: { gte: startOfYear },
    },
    select: { salePrice: true, purchasePrice: true },
  })
  return vehicles.reduce((acc, v) => {
    const sale = Number(v.salePrice ?? 0)
    const purchase = Number(v.purchasePrice ?? 0)
    return acc + (sale - purchase)
  }, 0)
}

export async function getRecentlySold(floorplanLineId: string, limit = 5) {
  return prisma.vehicle.findMany({
    where: { floorplanLineId, status: "paid_off" },
    orderBy: { paidOffDate: "desc" },
    take: limit,
  })
}

export async function getMonthlyPayoffTotal(floorplanLineId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const result = await prisma.transaction.aggregate({
    where: {
      floorplanLineId,
      type: "payoff",
      date: { gte: startOfMonth, lt: startOfNext },
    },
    _sum: { amount: true },
  })
  return Number(result._sum.amount ?? 0)
}

export async function getAvgDaysToPayoff(floorplanLineId: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      floorplanLineId,
      status: "paid_off",
      paidOffDate: { not: null },
    },
    select: { purchaseDate: true, paidOffDate: true },
  })
  if (vehicles.length === 0) return 0
  const total = vehicles.reduce((acc, v) => {
    if (!v.paidOffDate) return acc
    return acc + Math.max(0, differenceInCalendarDays(v.paidOffDate, v.purchaseDate))
  }, 0)
  return Math.round(total / vehicles.length)
}

export async function getOutstandingBalanceAtDate(
  floorplanLineId: string,
  date: Date
) {
  const grouped = await prisma.transaction.groupBy({
    by: ["type"],
    where: { floorplanLineId, date: { lte: date } },
    _sum: { amount: true },
  })
  let advances = 0
  let payoffs = 0
  let adjustments = 0
  for (const row of grouped) {
    const sum = Number(row._sum.amount ?? 0)
    if (row.type === "advance") advances += sum
    else if (row.type === "payoff") payoffs += sum
    else if (row.type === "adjustment") adjustments += sum
  }
  return Math.max(0, advances - payoffs + adjustments)
}

export async function getTransactionsInRange(
  floorplanLineId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.transaction.findMany({
    where: {
      floorplanLineId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
    include: {
      vehicle: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          trim: true,
          vin: true,
          stockNumber: true,
        },
      },
    },
  })
}

export async function getPaidOffVehiclesInRange(
  floorplanLineId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.vehicle.findMany({
    where: {
      floorplanLineId,
      status: "paid_off",
      paidOffDate: { gte: startDate, lte: endDate },
    },
    orderBy: { paidOffDate: "desc" },
  })
}

export async function getActiveVehiclesAtDate(
  floorplanLineId: string,
  date: Date
) {
  // A vehicle was "active" at `date` if it was purchased on/before that date
  // AND either it hasn't been paid off, or was paid off after that date.
  return prisma.vehicle.findMany({
    where: {
      floorplanLineId,
      purchaseDate: { lte: date },
      OR: [
        { paidOffDate: null },
        { paidOffDate: { gt: date } },
      ],
    },
    orderBy: { purchaseDate: "asc" },
  })
}

export async function getAllActiveInventory(floorplanLineId: string) {
  return prisma.vehicle.findMany({
    where: { floorplanLineId, status: "active" },
    orderBy: { purchaseDate: "asc" },
  })
}

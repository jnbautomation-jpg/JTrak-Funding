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

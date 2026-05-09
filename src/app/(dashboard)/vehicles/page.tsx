import { differenceInCalendarDays } from "date-fns"

import { prisma } from "@/lib/prisma"
import {
  getAvailableCredit,
  getPrimaryFloorplan,
} from "@/lib/floorplan"
import { AddVehicleButton } from "./_components/add-vehicle-dialog"
import { Pagination } from "./_components/pagination"
import { VehiclesEmptyState } from "./_components/empty-state"
import { VehiclesToolbar } from "./_components/toolbar"
import { VehiclesTable, type VehicleRow } from "./_components/vehicles-table"

const PAGE_SIZE = 25

type SearchParams = Promise<{
  tab?: string
  q?: string
  source?: string
  page?: string
}>

const STATUS_FROM_TAB: Record<string, string | undefined> = {
  active: "active",
  paid_off: "paid_off",
  all: undefined,
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const tab = sp.tab && sp.tab in STATUS_FROM_TAB ? sp.tab : "active"
  const q = (sp.q ?? "").trim()
  const source = sp.source ?? ""
  const page = Math.max(1, Number(sp.page) || 1)
  const status = STATUS_FROM_TAB[tab]

  const floorplan = await getPrimaryFloorplan()
  if (!floorplan) {
    // Layout will redirect, but be defensive.
    return null
  }

  // Discover all distinct sources for filter dropdown — small dataset, OK to query.
  const sourceRows = await prisma.vehicle.findMany({
    where: { floorplanLineId: floorplan.id, source: { not: null } },
    distinct: ["source"],
    select: { source: true },
  })
  const sources = sourceRows
    .map((r) => r.source!)
    .filter((s) => s.trim().length > 0)
    .sort()

  const where = {
    floorplanLineId: floorplan.id,
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
    ...(q
      ? {
          OR: [
            { vin: { contains: q, mode: "insensitive" as const } },
            { stockNumber: { contains: q, mode: "insensitive" as const } },
            { make: { contains: q, mode: "insensitive" as const } },
            { model: { contains: q, mode: "insensitive" as const } },
            ...(Number.isInteger(Number(q)) ? [{ year: Number(q) }] : []),
          ],
        }
      : {}),
  }

  const totalAnyVehicles = await prisma.vehicle.count({
    where: { floorplanLineId: floorplan.id },
  })
  const total = await prisma.vehicle.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const skip = (safePage - 1) * PAGE_SIZE

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    skip,
    take: PAGE_SIZE,
  })

  const today = new Date()
  const rows: VehicleRow[] = vehicles.map((v) => {
    const reference = v.status === "paid_off" && v.saleDate ? v.saleDate : today
    return {
      id: v.id,
      vin: v.vin,
      year: v.year,
      make: v.make,
      model: v.model,
      trim: v.trim,
      mileage: v.mileage,
      purchasePrice: Number(v.purchasePrice),
      advanceAmount: Number(v.advanceAmount),
      purchaseDate: v.purchaseDate.toISOString(),
      source: v.source,
      stockNumber: v.stockNumber,
      status: v.status,
      salePrice: v.salePrice != null ? Number(v.salePrice) : null,
      daysOnLot: Math.max(0, differenceInCalendarDays(reference, v.purchaseDate)),
    }
  })

  const availableCredit = await getAvailableCredit(
    floorplan.id,
    Number(floorplan.creditLimit)
  )

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-1.5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-semibold tracking-tight leading-none">
            Vehicles
          </h1>
          <p className="text-[13.5px] text-muted-foreground">
            Manage your floorplan inventory.
          </p>
        </div>
        <AddVehicleButton sources={sources} availableCredit={availableCredit} />
      </header>

      <VehiclesToolbar sources={sources} total={total} />

      {rows.length === 0 ? (
        <VehiclesEmptyState
          hasAnyVehicles={totalAnyVehicles > 0}
          sources={sources}
        />
      ) : (
        <>
          <VehiclesTable vehicles={rows} />
          <Pagination page={safePage} totalPages={totalPages} />
        </>
      )}
    </div>
  )
}

import "server-only"

import type { Transaction, Vehicle } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export type MarkAsPaidOffInput = {
  vehicleId: string
  salePrice: number
  saleDate: Date
  buyerName?: string
}

export async function markVehicleAsPaidOff(
  input: MarkAsPaidOffInput
): Promise<{ vehicle: Vehicle; transaction: Transaction }> {
  const { vehicleId, salePrice, saleDate, buyerName } = input

  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    throw new Error("Sale price must be greater than zero")
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.vehicle.findUnique({ where: { id: vehicleId } })
    if (!existing) throw new Error("Vehicle not found")
    if (existing.status === "paid_off") {
      throw new Error("Vehicle is already paid off")
    }
    if (saleDate.getTime() < new Date(existing.purchaseDate).getTime()) {
      throw new Error("Sale date can't be before purchase date")
    }

    const vehicle = await tx.vehicle.update({
      where: { id: vehicleId },
      data: {
        salePrice,
        saleDate,
        buyerName: buyerName?.trim() || null,
        status: "paid_off",
        paidOffDate: saleDate,
      },
    })

    const description = `Payoff for ${vehicle.year} ${vehicle.make} ${vehicle.model} (VIN ...${vehicle.vin.slice(-4)})`

    const transaction = await tx.transaction.create({
      data: {
        floorplanLineId: vehicle.floorplanLineId,
        vehicleId: vehicle.id,
        type: "payoff",
        amount: existing.advanceAmount,
        date: saleDate,
        description,
      },
    })

    return { vehicle, transaction }
  })
}

export async function reverseVehiclePayoff(vehicleId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.vehicle.findUnique({ where: { id: vehicleId } })
    if (!existing) throw new Error("Vehicle not found")
    if (existing.status !== "paid_off") {
      throw new Error("Vehicle is not paid off")
    }

    await tx.transaction.deleteMany({
      where: { vehicleId, type: "payoff" },
    })

    await tx.vehicle.update({
      where: { id: vehicleId },
      data: {
        salePrice: null,
        saleDate: null,
        buyerName: null,
        paidOffDate: null,
        status: "active",
      },
    })
  })
}

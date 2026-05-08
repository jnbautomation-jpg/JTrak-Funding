"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPrimaryFloorplan } from "@/lib/floorplan"

const baseVehicleSchema = z.object({
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .length(17, "VIN must be 17 characters")
    .regex(/^[A-HJ-NPR-Z0-9]+$/, "VIN contains invalid characters"),
  year: z
    .number()
    .int()
    .min(1900, "Year too old")
    .max(new Date().getFullYear() + 1),
  make: z.string().trim().min(1, "Required").max(60),
  model: z.string().trim().min(1, "Required").max(80),
  trim: z.string().trim().max(80).optional().or(z.literal("")),
  mileage: z.number().int().nonnegative().optional().nullable(),
  purchasePrice: z.number().positive("Must be greater than zero"),
  purchaseDate: z.coerce.date(),
  source: z.string().trim().max(60).optional().or(z.literal("")),
  stockNumber: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
})

type CreateInput = z.input<typeof baseVehicleSchema>
type Result = { ok: true; id: string } | { ok: false; error: string }

export async function createVehicle(input: CreateInput): Promise<Result> {
  await requireUser()
  const floorplan = await getPrimaryFloorplan()
  if (!floorplan) return { ok: false, error: "No floorplan configured" }

  const parsed = baseVehicleSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const data = parsed.data

  const existing = await prisma.vehicle.findUnique({
    where: { vin: data.vin },
    select: { id: true },
  })
  if (existing) {
    return { ok: false, error: "A vehicle with this VIN already exists" }
  }

  const description = `Advance for ${data.year} ${data.make} ${data.model} (VIN ...${data.vin.slice(-4)})`

  try {
    const created = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data: {
          floorplanLineId: floorplan.id,
          vin: data.vin,
          year: data.year,
          make: data.make,
          model: data.model,
          trim: data.trim || null,
          mileage: data.mileage ?? null,
          purchasePrice: data.purchasePrice,
          advanceAmount: data.purchasePrice,
          purchaseDate: data.purchaseDate,
          source: data.source || null,
          stockNumber: data.stockNumber || null,
          notes: data.notes || null,
          status: "active",
        },
      })
      await tx.transaction.create({
        data: {
          floorplanLineId: floorplan.id,
          vehicleId: vehicle.id,
          type: "advance",
          amount: data.purchasePrice,
          date: data.purchaseDate,
          description,
        },
      })
      return vehicle
    })

    revalidatePath("/")
    revalidatePath("/vehicles")
    return { ok: true, id: created.id }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create vehicle",
    }
  }
}

const updateVehicleSchema = baseVehicleSchema.extend({
  id: z.string().min(1),
})

type UpdateInput = z.input<typeof updateVehicleSchema>

export async function updateVehicle(input: UpdateInput): Promise<Result> {
  await requireUser()
  const parsed = updateVehicleSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const data = parsed.data

  try {
    await prisma.vehicle.update({
      where: { id: data.id },
      data: {
        vin: data.vin,
        year: data.year,
        make: data.make,
        model: data.model,
        trim: data.trim || null,
        mileage: data.mileage ?? null,
        purchasePrice: data.purchasePrice,
        purchaseDate: data.purchaseDate,
        source: data.source || null,
        stockNumber: data.stockNumber || null,
        notes: data.notes || null,
      },
    })
    revalidatePath("/")
    revalidatePath("/vehicles")
    revalidatePath(`/vehicles/${data.id}`)
    return { ok: true, id: data.id }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update vehicle",
    }
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  await requireUser()

  await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { vehicleId: id } })
    await tx.vehicle.delete({ where: { id } })
  })

  revalidatePath("/")
  revalidatePath("/vehicles")
  redirect("/vehicles")
}

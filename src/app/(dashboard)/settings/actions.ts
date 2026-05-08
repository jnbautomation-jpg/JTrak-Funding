"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  getOutstandingBalance,
  getPrimaryFloorplan,
} from "@/lib/floorplan"

const schema = z.object({
  investorName: z.string().min(1).max(120),
  investorEmail: z.string().email().optional().or(z.literal("")),
  investorPhone: z.string().max(40).optional().or(z.literal("")),
  investorNotes: z.string().max(2000).optional().or(z.literal("")),
  floorplanName: z.string().min(1).max(120),
  creditLimit: z.number().positive(),
})

export type SettingsResult =
  | { ok: true; warning?: string }
  | { ok: false; error: string }

export async function updateFloorplanSettings(input: {
  investorName: string
  investorEmail: string
  investorPhone: string
  investorNotes: string
  floorplanName: string
  creditLimit: number
}): Promise<SettingsResult> {
  await requireUser()

  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    }
  }
  const data = parsed.data

  const floorplan = await getPrimaryFloorplan()
  if (!floorplan) {
    return { ok: false, error: "No floorplan configured" }
  }

  let warning: string | undefined
  const outstanding = await getOutstandingBalance(floorplan.id)
  if (data.creditLimit < outstanding) {
    warning = `New limit is below outstanding balance of $${outstanding.toLocaleString(
      "en-US"
    )}.`
  }

  await prisma.$transaction([
    prisma.investor.update({
      where: { id: floorplan.investorId },
      data: {
        name: data.investorName,
        email: data.investorEmail || null,
        phone: data.investorPhone || null,
        notes: data.investorNotes || null,
      },
    }),
    prisma.floorplanLine.update({
      where: { id: floorplan.id },
      data: {
        name: data.floorplanName,
        creditLimit: data.creditLimit,
      },
    }),
  ])

  revalidatePath("/")
  revalidatePath("/settings")
  revalidatePath("/vehicles")
  return { ok: true, warning }
}

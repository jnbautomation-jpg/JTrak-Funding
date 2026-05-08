"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  investorName: z.string().min(1, "Required").max(120),
  investorEmail: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  investorPhone: z.string().max(40).optional().or(z.literal("")),
  investorNotes: z.string().max(2000).optional().or(z.literal("")),
  floorplanName: z.string().min(1, "Required").max(120),
  creditLimit: z
    .number()
    .positive("Must be greater than zero")
    .max(100_000_000),
})

export type OnboardingState = {
  ok?: boolean
  error?: string
} | null

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  await requireUser()

  const parsed = schema.safeParse({
    investorName: formData.get("investorName"),
    investorEmail: formData.get("investorEmail") || "",
    investorPhone: formData.get("investorPhone") || "",
    investorNotes: formData.get("investorNotes") || "",
    floorplanName: formData.get("floorplanName"),
    creditLimit: Number(formData.get("creditLimit") || 0),
  })

  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.message ?? "Invalid input" }
  }

  const data = parsed.data

  // If a floorplan already exists, just send them home — no duplicate setup.
  const existing = await prisma.floorplanLine.findFirst()
  if (existing) {
    redirect("/")
  }

  await prisma.investor.create({
    data: {
      name: data.investorName,
      email: data.investorEmail || null,
      phone: data.investorPhone || null,
      notes: data.investorNotes || null,
      floorplanLines: {
        create: {
          name: data.floorplanName,
          creditLimit: data.creditLimit,
        },
      },
    },
  })

  revalidatePath("/")
  redirect("/")
}

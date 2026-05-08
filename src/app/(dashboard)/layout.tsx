import { redirect } from "next/navigation"

import { requireUser } from "@/lib/auth"
import {
  getOutstandingBalance,
  getPrimaryFloorplan,
} from "@/lib/floorplan"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const floorplan = await getPrimaryFloorplan()
  if (!floorplan) redirect("/onboarding")

  const creditLimit = Number(floorplan.creditLimit)
  const outstanding = await getOutstandingBalance(floorplan.id)
  const stats = { creditLimit, outstanding }

  return (
    <div className="min-h-screen">
      <Sidebar stats={stats} />
      <div className="lg:pl-[240px]">
        <Topbar userEmail={user.email ?? ""} stats={stats} />
        <main className="px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  )
}

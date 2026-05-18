import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getUser } from "@/lib/auth"
import { getPrimaryFloorplan } from "@/lib/floorplan"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { FloorplanForm } from "./floorplan-form"
import { AccountPanel } from "./account-panel"

export const metadata: Metadata = {
  title: "Settings – JTrak Funding",
}

export default async function SettingsPage() {
  const user = await getUser()
  if (!user) redirect("/login")

  const floorplan = await getPrimaryFloorplan()
  if (!floorplan) redirect("/onboarding")

  const initial = {
    investorName: floorplan.investor.name,
    investorEmail: floorplan.investor.email ?? "",
    investorPhone: floorplan.investor.phone ?? "",
    investorNotes: floorplan.investor.notes ?? "",
    floorplanName: floorplan.name,
    creditLimit: Number(floorplan.creditLimit),
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold tracking-tight leading-none">
          Settings
        </h1>
        <p className="text-[13.5px] text-muted-foreground">
          Manage your floorplan terms, investor profile, and account.
        </p>
      </header>

      <Tabs defaultValue="floorplan" className="w-full">
        <TabsList className="h-8 w-full sm:w-fit">
          <TabsTrigger value="floorplan" className="px-3 text-[12.5px] flex-1 sm:flex-initial">
            Floorplan
          </TabsTrigger>
          <TabsTrigger value="account" className="px-3 text-[12.5px] flex-1 sm:flex-initial">
            Account
          </TabsTrigger>
        </TabsList>
        <TabsContent value="floorplan" className="mt-4 max-w-3xl">
          <FloorplanForm initial={initial} />
        </TabsContent>
        <TabsContent value="account" className="mt-4 max-w-3xl">
          <AccountPanel email={user.email ?? ""} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

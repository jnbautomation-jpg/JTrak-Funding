import { redirect } from "next/navigation"

import { requireUser } from "@/lib/auth"
import { getPrimaryFloorplan } from "@/lib/floorplan"
import { OnboardingWizard } from "./wizard"

export default async function OnboardingPage() {
  await requireUser()
  const existing = await getPrimaryFloorplan()
  if (existing) redirect("/")

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="absolute inset-0 bg-emerald-radial" aria-hidden />
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        aria-hidden
      />
      <div className="relative grid min-h-screen place-items-center px-4 py-12">
        <div className="w-full max-w-[480px]">
          <div className="mb-9 flex flex-col items-center gap-3">
            <span
              aria-hidden
              className="grid size-10 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/30 text-primary"
            >
              <span className="text-base font-semibold tracking-tight">J</span>
            </span>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h1 className="text-[20px] font-semibold tracking-tight leading-none">
                Set up your floorplan
              </h1>
              <p className="text-[12px] text-muted-foreground">
                This is a one-time setup. You can edit these details later in
                Settings.
              </p>
            </div>
          </div>

          <OnboardingWizard />
        </div>
      </div>
    </div>
  )
}

import { Car } from "lucide-react"
import { AddVehicleButton } from "./add-vehicle-dialog"

export function VehiclesEmptyState({
  hasAnyVehicles,
  sources,
}: {
  hasAnyVehicles: boolean
  sources: string[]
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/40 px-6 py-20">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-card border border-border/80 text-muted-foreground">
          <Car className="size-5" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[15px] font-semibold tracking-tight">
            {hasAnyVehicles ? "No vehicles in this view" : "No vehicles yet"}
          </h3>
          <p className="text-[12.5px] text-muted-foreground">
            {hasAnyVehicles
              ? "Try a different tab or clear your filters."
              : "Add your first vehicle to start tracking your floorplan."}
          </p>
        </div>
        <AddVehicleButton sources={sources} />
      </div>
    </div>
  )
}

import { Car } from "lucide-react"
import { PhasePlaceholder } from "@/components/phase-placeholder"

export default function VehiclesPage() {
  return (
    <PhasePlaceholder
      title="Vehicles"
      subtitle="Manage every vehicle you've floored against the line of credit."
      icon={Car}
      features={[
        "Add vehicles by VIN with automatic decoding",
        "Track advance amount, days on lot, sale status",
        "Mark units as sold, paid off, or repossessed",
        "Filter by status, age, and floorplan line",
      ]}
    />
  )
}

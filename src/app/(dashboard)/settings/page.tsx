import { Settings as SettingsIcon } from "lucide-react"
import { PhasePlaceholder } from "@/components/phase-placeholder"

export default function SettingsPage() {
  return (
    <PhasePlaceholder
      title="Settings"
      subtitle="Configure your dealership profile, investor contacts, and floorplan terms."
      icon={SettingsIcon}
      features={[
        "Dealership profile and tax information",
        "Investor contacts and credit-line terms",
        "User accounts and role-based permissions",
        "Notifications, time zone, and display preferences",
      ]}
    />
  )
}

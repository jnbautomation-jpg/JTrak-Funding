import { ArrowLeftRight } from "lucide-react"
import { PhasePlaceholder } from "@/components/phase-placeholder"

export default function TransactionsPage() {
  return (
    <PhasePlaceholder
      title="Transactions"
      subtitle="Every advance, payoff, and adjustment against your floorplan line."
      icon={ArrowLeftRight}
      features={[
        "Auto-recorded advances when vehicles are added",
        "Auto-recorded payoffs when vehicles are sold",
        "Manual adjustments with audit trail",
        "Export ledger as CSV for monthly investor reports",
      ]}
    />
  )
}

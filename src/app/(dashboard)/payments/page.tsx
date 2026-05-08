import { Wallet } from "lucide-react"
import { PhasePlaceholder } from "@/components/phase-placeholder"

export default function PaymentsPage() {
  return (
    <PhasePlaceholder
      title="Payments"
      subtitle="Investor payments applied to vehicle payoffs and floorplan reductions."
      phase="Phase 3"
      icon={Wallet}
      features={[
        "Record investor payments with method and reference",
        "Auto-link payments to specific vehicle payoffs",
        "Reconcile balances against the line of credit",
        "Track payment history per investor",
      ]}
    />
  )
}

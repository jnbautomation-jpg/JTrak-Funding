import { FileText } from "lucide-react"
import { PhasePlaceholder } from "@/components/phase-placeholder"

export default function ReportsPage() {
  return (
    <PhasePlaceholder
      title="Reports"
      subtitle="Monthly statements, aging analyses, and investor summaries."
      icon={FileText}
      phase="Phase 5"
      features={[
        "Monthly investor statements with running balance",
        "Aging report by 30/60/90/90+ buckets",
        "Sold inventory P&L with gross margin",
        "PDF and CSV export with custom date ranges",
      ]}
    />
  )
}

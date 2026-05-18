import { Skeleton } from "@/components/ui/skeleton"

export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-8 w-72" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

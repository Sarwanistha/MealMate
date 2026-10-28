import { Skeleton } from '@/components/ui/skeleton'

export default function OrderCardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-14" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  )
}

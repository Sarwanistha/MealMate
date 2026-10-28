import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/EmptyState'

export default function ErrorState({ error, onRetry, title = "Couldn't load this" }) {
  return (
    <EmptyState
      emoji="🫠"
      title={title}
      description={error?.message || 'Something went wrong.'}
      action={
        onRetry && (
          <Button onClick={onRetry} className="h-11 rounded-xl font-bold active:scale-95">
            <RotateCw className="size-4" /> Retry
          </Button>
        )
      }
    />
  )
}

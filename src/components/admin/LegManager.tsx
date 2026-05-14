import type { Leg } from '@/types'
import { Button } from '@/components/ui/button'

interface Props {
  legs: Leg[]
  activeLeg: string
  onSelectLeg: (id: string) => void
}

export default function LegManager({ legs, activeLeg, onSelectLeg }: Props) {
  if (legs.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        variant={activeLeg === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectLeg('all')}
      >
        All legs
      </Button>
      {legs.map(l => (
        <Button
          key={l.id}
          variant={activeLeg === l.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectLeg(l.id)}
        >
          {l.name ?? `Leg ${l.leg_number}`}
        </Button>
      ))}
    </div>
  )
}

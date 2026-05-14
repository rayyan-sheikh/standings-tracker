import { cn } from '@/lib/utils'

interface Props {
  variant?: 'horizontal' | 'stacked'
  color?: 'green' | 'blue'
  className?: string
}

export default function Logo({ variant = 'horizontal', color = 'green', className }: Props) {
  const accent = color === 'blue' ? 'text-blue-400' : 'text-green-400'

  if (variant === 'stacked') {
    return (
      <div className={cn('flex flex-col items-center leading-none', className)}>
        <span
          className={`text-4xl font-extrabold tracking-tight ${accent}`}
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          Standings
        </span>
        <span
          className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 mt-1"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Tracker
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-baseline gap-1.5 leading-none', className)}>
      <span
        className={`text-lg font-extrabold tracking-tight ${accent}`}
        style={{ fontFamily: 'Sora, sans-serif' }}
      >
        Standings
      </span>
      <span
        className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600"
        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        tracker
      </span>
    </div>
  )
}

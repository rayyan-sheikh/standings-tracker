import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/shared/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        root: 'select-none',
        months: 'flex flex-col',
        month: 'space-y-2',
        month_caption: 'flex justify-center items-center relative py-1',
        caption_label: 'text-sm font-medium text-zinc-300',
        nav: 'absolute inset-x-0 top-1 flex justify-between px-1',
        button_previous: 'h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 transition-colors',
        button_next: 'h-7 w-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 transition-colors',
        chevron: 'h-4 w-4 fill-current',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-zinc-600 w-9 text-[0.7rem] font-medium text-center py-1',
        weeks: 'flex flex-col gap-0.5',
        week: 'flex',
        day: 'flex items-center justify-center w-9 h-8 p-0 relative',
        day_button: [
          'w-9 h-8 rounded-md text-[0.8rem] font-normal text-zinc-300',
          'hover:bg-zinc-700 hover:text-zinc-100 transition-colors cursor-pointer',
          'focus:outline-none',
        ].join(' '),
        selected: 'bg-blue-500 text-white rounded-md hover:bg-blue-500',
        today: 'text-blue-400 font-bold',
        outside: 'text-zinc-700 opacity-40',
        disabled: 'text-zinc-700 opacity-30 cursor-not-allowed',
        hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }

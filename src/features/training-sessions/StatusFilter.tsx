import { useId } from 'react'
import {
  isSessionStatus,
  SESSION_STATUS_LABELS,
  SESSION_STATUSES,
  type StatusFilterValue,
} from './types.ts'

interface StatusFilterProps {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  const id = useId()

  return (
    <div className="status-filter">
      <label htmlFor={id}>Status</label>
      <select
        id={id}
        name="status"
        value={value}
        onChange={(event) => {
          const next = event.target.value
          onChange(isSessionStatus(next) ? next : 'all')
        }}
      >
        <option value="all">All</option>
        {SESSION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {SESSION_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </div>
  )
}

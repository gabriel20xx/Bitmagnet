export interface FilterOption<T extends string> {
  value: T
  label: string
  count: number
}

// A group with no active selection is treated as "everything shown". Unchecking the first option
// therefore switches to an explicit set containing every other value; re-checking every option
// collapses back to "no filter" rather than lingering as a full explicit set.
export function toggleFilterValue<T>(selected: Set<T>, allValues: T[], value: T): Set<T> {
  if (selected.size === 0) {
    return new Set(allValues.filter((v) => v !== value))
  }

  const next = new Set(selected)
  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }

  if (next.size === allValues.length) return new Set()

  return next
}

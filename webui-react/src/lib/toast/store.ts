export interface ToastItem {
  id: number
  message: string
  expiry: number
}

const defaultExpiry = 10_000

let nextId = 1
let toasts: ToastItem[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToasts(): ToastItem[] {
  return toasts
}

export function addError(message: string, expiry = defaultExpiry) {
  toasts = [...toasts, { id: nextId++, message, expiry }]
  emit()
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatVolume(m3: number): string {
  return `${m3.toFixed(3)} m³`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export const CONTAINER_VOLUMES = {
  lcl: null, // variable
  '20ft': 33.2,
  '40ft': 67.7,
} as const

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  quoted: 'Quoted',
  invoice_sent: 'Invoice Sent',
  paid: 'Paid',
}

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  quoted: 'bg-orange-100 text-orange-800',
  invoice_sent: 'bg-indigo-100 text-indigo-800',
  paid: 'bg-emerald-100 text-emerald-800',
}

export const CONDITION_COLORS: Record<string, string> = {
  good: 'text-green-600',
  fragile: 'text-yellow-600',
  damaged: 'text-red-600',
}

export function getContainerFillPercent(volumeM3: number, containerType: '20ft' | '40ft' | 'lcl'): number {
  if (containerType === 'lcl') return 100
  const capacity = CONTAINER_VOLUMES[containerType]!
  return Math.min(Math.round((volumeM3 / capacity) * 100), 100)
}
